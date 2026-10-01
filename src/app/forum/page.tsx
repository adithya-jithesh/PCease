import type { Metadata } from "next";
import Link from "next/link";
import { ArrowBigUp, MessageSquare, PenLine } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { FORUM_TOPICS, type ForumTopic, type Thread } from "@/lib/types";
import { TOPIC_LABELS } from "./topics";

export const metadata: Metadata = { title: "Forum" };

const SORTS = { active: "last_activity_at", top: "score", new: "created_at" } as const;
type Sort = keyof typeof SORTS;

export default async function ForumPage({ searchParams }: PageProps<"/forum">) {
  const params = await searchParams;
  const topic = FORUM_TOPICS.includes(params.topic as ForumTopic) ? (params.topic as ForumTopic) : undefined;
  const sort: Sort = params.sort === "top" || params.sort === "new" ? params.sort : "active";

  const supabase = await createClient();
  let query = supabase
    .from("threads")
    .select("id, topic, title, body, score, reply_count, created_at, last_activity_at, build_id, author_id, author:profiles(username, avatar_url)")
    .order(SORTS[sort], { ascending: false })
    .limit(50);
  if (topic) query = query.eq("topic", topic);
  const { data } = await query;
  const threads = (data ?? []) as unknown as Thread[];

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { topic, sort: sort === "active" ? undefined : sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/forum?${qs}` : "/forum";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Forum</h1>
        </div>
        <Link href="/forum/new" className="btn-primary">
          <PenLine className="size-4" /> New thread
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
          <Link href={href({ topic: undefined })} className={`btn shrink-0 ${!topic ? "bg-accent-soft text-accent" : "btn-outline"}`}>
            All
          </Link>
          {FORUM_TOPICS.map((t) => (
            <Link key={t} href={href({ topic: t })} className={`btn shrink-0 ${topic === t ? "bg-accent-soft text-accent" : "btn-outline"}`}>
              {TOPIC_LABELS[t]}
            </Link>
          ))}
        </div>
        <div className="flex gap-1 text-sm">
          {(Object.keys(SORTS) as Sort[]).map((s) => (
            <Link
              key={s}
              href={href({ sort: s === "active" ? undefined : s })}
              className={`rounded-full px-3 py-1 capitalize ${sort === s ? "bg-surface-2 font-medium" : "text-muted hover:text-ink"}`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <ul className="card mt-6 divide-y divide-line">
        {threads.map((t) => (
          <li key={t.id}>
            <Link href={`/forum/${t.id}`} className="flex gap-4 p-4 transition hover:bg-surface-2/50">
              <div className="flex w-10 shrink-0 flex-col items-center font-mono text-sm">
                <ArrowBigUp className="size-5 text-muted" />
                {t.score}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">{TOPIC_LABELS[t.topic]}</span>
                  {t.build_id && <span className="chip border-accent/40 text-accent">build attached</span>}
                </div>
                <h2 className="mt-1.5 font-display font-semibold">{t.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{t.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {t.author ? `@${t.author.username}` : "deleted user"} · {timeAgo(t.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-1 text-sm text-muted">
                <MessageSquare className="mt-0.5 size-4" /> {t.reply_count}
              </div>
            </Link>
          </li>
        ))}
        {!threads.length && (
          <li className="p-10 text-center text-muted">
            No threads here yet.{" "}
            <Link href="/forum/new" className="text-accent underline">
              Start the conversation
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
