-- PCease v2: price tracking
-- Adds price history, update bookkeeping and an audit log of automatic runs.

-- Where a listing's current price came from.
alter table public.listings
  add column if not exists source text not null default 'seed'
  check (source in ('seed', 'ai', 'manual'));

-- When the updater last looked this part up (null = never).
alter table public.parts
  add column if not exists prices_checked_at timestamptz;

create index if not exists parts_prices_checked_idx on public.parts (prices_checked_at nulls first);

-- Every price a listing has had, recorded automatically.
create table if not exists public.price_history (
  id           bigint generated always as identity primary key,
  part_id      bigint not null references public.parts (id) on delete cascade,
  retailer_id  smallint not null references public.retailers (id) on delete cascade,
  price_inr    integer not null,
  in_stock     boolean not null,
  source       text not null,
  recorded_at  timestamptz not null default now()
);

create index if not exists price_history_part_idx on public.price_history (part_id, recorded_at desc);

create or replace function public.record_price_history()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.price_inr is distinct from old.price_inr
     or new.in_stock is distinct from old.in_stock then
    insert into public.price_history (part_id, retailer_id, price_inr, in_stock, source)
    values (new.part_id, new.retailer_id, new.price_inr, new.in_stock, new.source);
  end if;
  return new;
end;
$$;

drop trigger if exists listings_price_history on public.listings;
create trigger listings_price_history
  after insert or update on public.listings
  for each row execute function public.record_price_history();

-- Start the history from today's prices.
insert into public.price_history (part_id, retailer_id, price_inr, in_stock, source, recorded_at)
select l.part_id, l.retailer_id, l.price_inr, l.in_stock, l.source, l.updated_at
from public.listings l
where not exists (select 1 from public.price_history h where h.part_id = l.part_id and h.retailer_id = l.retailer_id);

-- One row per automatic or manual update run, for the admin page.
create table if not exists public.price_runs (
  id           bigint generated always as identity primary key,
  trigger      text not null check (trigger in ('cron', 'admin', 'cli')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  checked      integer not null default 0,
  updated      integer not null default 0,
  rejected     integer not null default 0,
  details      jsonb not null default '[]'::jsonb
);

alter table public.price_history enable row level security;
alter table public.price_runs    enable row level security;

-- Price history is public; run logs are only readable with the service role.
drop policy if exists "price history is public" on public.price_history;
create policy "price history is public" on public.price_history for select using (true);
