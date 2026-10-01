-- PCease v2 schema
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (char_length(username) between 3 and 32),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  base text;
begin
  base := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1), ''),
    split_part(new.email, '@', 1)
  );
  base := left(regexp_replace(lower(base), '[^a-z0-9_]', '', 'g'), 24);
  if char_length(base) < 3 then
    base := 'builder';
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    case
      when exists (select 1 from public.profiles where username = base)
        then base || '_' || left(replace(new.id::text, '-', ''), 6)
      else base
    end,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create type public.part_category as enum (
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'
);

create table public.retailers (
  id          smallint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  homepage    text not null,
  -- `{q}` is replaced with the URL-encoded product name.
  search_url  text not null
);

create table public.parts (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  category    public.part_category not null,
  brand       text not null,
  name        text not null,
  specs       jsonb not null default '{}'::jsonb,
  -- Typical power draw in watts, used by the PSU estimator.
  watts       integer,
  -- Relative performance tier 1-5 (CPU and GPU only), used for balance checks.
  tier        smallint check (tier between 1 and 5),
  image_url   text,
  created_at  timestamptz not null default now()
);

create index parts_category_idx on public.parts (category);
create index parts_search_idx on public.parts
  using gin (to_tsvector('simple', brand || ' ' || name));

create table public.listings (
  part_id      bigint not null references public.parts (id) on delete cascade,
  retailer_id  smallint not null references public.retailers (id) on delete cascade,
  price_inr    integer not null check (price_inr > 0),
  url          text,
  in_stock     boolean not null default true,
  updated_at   timestamptz not null default now(),
  primary key (part_id, retailer_id)
);

create index listings_part_idx on public.listings (part_id);

-- Parts with their best in-stock price, for list views and sorting.
create view public.part_summaries
with (security_invoker = true) as
select
  p.*,
  min(l.price_inr) filter (where l.in_stock) as best_price,
  count(l.*) filter (where l.in_stock)       as offer_count
from public.parts p
left join public.listings l on l.part_id = p.id
group by p.id;

-- ---------------------------------------------------------------------------
-- Builds
-- ---------------------------------------------------------------------------
create table public.builds (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  title       text not null default 'Untitled build' check (char_length(title) <= 80),
  notes       text check (char_length(notes) <= 2000),
  -- { "cpu": 12, "gpu": 4, ... } keyed by slot
  parts       jsonb not null default '{}'::jsonb,
  total_inr   integer not null default 0,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index builds_owner_idx on public.builds (owner_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Forum
-- ---------------------------------------------------------------------------
create type public.forum_topic as enum (
  'build-help', 'troubleshooting', 'deals', 'showcase', 'general'
);

create table public.threads (
  id           bigint generated always as identity primary key,
  author_id    uuid references public.profiles (id) on delete set null,
  topic        public.forum_topic not null default 'general',
  title        text not null check (char_length(title) between 5 and 160),
  body         text not null check (char_length(body) between 10 and 10000),
  build_id     uuid references public.builds (id) on delete set null,
  score        integer not null default 0,
  reply_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index threads_activity_idx on public.threads (last_activity_at desc);
create index threads_topic_idx on public.threads (topic);

create table public.replies (
  id          bigint generated always as identity primary key,
  thread_id   bigint not null references public.threads (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index replies_thread_idx on public.replies (thread_id, created_at);

create table public.thread_votes (
  thread_id  bigint not null references public.threads (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  primary key (thread_id, user_id)
);

-- Keep threads.score in sync with votes.
create or replace function public.sync_thread_score()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target bigint := coalesce(new.thread_id, old.thread_id);
begin
  update public.threads
     set score = (select coalesce(sum(value), 0) from public.thread_votes where thread_id = target)
   where id = target;
  return null;
end;
$$;

create trigger thread_votes_sync
  after insert or update or delete on public.thread_votes
  for each row execute function public.sync_thread_score();

-- Keep reply_count / last_activity_at in sync with replies.
create or replace function public.sync_thread_replies()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target bigint := coalesce(new.thread_id, old.thread_id);
begin
  update public.threads
     set reply_count = (select count(*) from public.replies where thread_id = target),
         last_activity_at = case when tg_op = 'INSERT' then now() else last_activity_at end
   where id = target;
  return null;
end;
$$;

create trigger replies_sync
  after insert or delete on public.replies
  for each row execute function public.sync_thread_replies();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.retailers    enable row level security;
alter table public.parts        enable row level security;
alter table public.listings     enable row level security;
alter table public.builds       enable row level security;
alter table public.threads      enable row level security;
alter table public.replies      enable row level security;
alter table public.thread_votes enable row level security;

-- Public read-only catalogue
create policy "catalogue is public" on public.retailers for select using (true);
create policy "catalogue is public" on public.parts     for select using (true);
create policy "catalogue is public" on public.listings  for select using (true);

-- Profiles
create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Builds: owners have full access, everyone can read public builds
create policy "read public or own builds" on public.builds
  for select using (is_public or (select auth.uid()) = owner_id);
create policy "insert own builds" on public.builds
  for insert with check ((select auth.uid()) = owner_id);
create policy "update own builds" on public.builds
  for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "delete own builds" on public.builds
  for delete using ((select auth.uid()) = owner_id);

-- Forum
create policy "threads are public" on public.threads for select using (true);
create policy "signed-in users post threads" on public.threads
  for insert with check ((select auth.uid()) = author_id);
create policy "authors delete threads" on public.threads
  for delete using ((select auth.uid()) = author_id);

create policy "replies are public" on public.replies for select using (true);
create policy "signed-in users reply" on public.replies
  for insert with check ((select auth.uid()) = author_id);
create policy "authors delete replies" on public.replies
  for delete using ((select auth.uid()) = author_id);

create policy "votes are public" on public.thread_votes for select using (true);
create policy "users cast own votes" on public.thread_votes
  for insert with check ((select auth.uid()) = user_id);
create policy "users change own votes" on public.thread_votes
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users retract own votes" on public.thread_votes
  for delete using ((select auth.uid()) = user_id);
