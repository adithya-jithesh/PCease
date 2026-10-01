import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Reply, Thread } from "@/lib/types";
import { TOPIC_LABELS } from "../topics";
import { DeleteReplyButton, DeleteThreadButton, ReplyForm, VoteButtons } from "./thread-controls";

async function loadThread(rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("threads")
    .select("*, author:profiles(username, avatar_url)")
    .eq("id", id)
    .maybeSingle();
  return data as Thread | null;
}

export async function generateMetadata({ params }: PageProps<"/forum/[id]">): Promise<Metadata> {
  const thread = await loadThread((await params).id);
  return thread ? { title: thread.title, description: thread.body.slice(0, 160) } : {};
}

export default async function ThreadPage({ params }: PageProps<"/forum/[id]">) {
  const thread = await loadThread((await params).id);
  if (!thread) notFound();

  const supabase = await createClient();
  const [{ data: replies }, { data: auth }, { data: build }] = await Promise.all([
    supabase
      .from("replies")
      .select("id, body, created_at, author_id, author:profiles(username, avatar_url)")
      .eq("thread_id", thread.id)
      .order("created_at"),
    supabase.auth.getUser(),
    thread.build_id
      ? supabase.from("saved_builds").select("id, title, total_inr").eq("id", thread.build_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const user = auth.user;

  let myVote = 0;
  if (user) {
    const { data } = await supabase
      .from("thread_votes")
      .select("value")
      .eq("thread_id", thread.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myVote = data?.value ?? 0;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/forum" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Forum
      </Link>

      <article className="mt-6 flex gap-4">
        <VoteButtons threadId={thread.id} score={thread.score} myVote={myVote} />
        <div className="min-w-0 flex-1">
          <span className="chip">{TOPIC_LABELS[thread.topic]}</span>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{thread.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {thread.author ? `@${thread.author.username}` : "deleted user"} · {timeAgo(thread.created_at)}
          </p>
          <div className="mt-5 leading-relaxed whitespace-pre-line">{thread.body}</div>

          {build && (
            <Link
              href={`/builds/${build.id}`}
              className="card mt-6 flex items-center gap-3 p-4 transition hover:border-ink"
            >
              <Wrench className="size-5 text-accent" />
              <div>
                <p className="font-medium">{build.title}</p>
                <p className="font-mono text-sm text-muted">₹{build.total_inr.toLocaleString("en-IN")}</p>
              </div>
            </Link>
          )}

          {user?.id === thread.author_id && <DeleteThreadButton threadId={thread.id} />}
        </div>
      </article>

      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold">
          {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
        </h2>
        <ul className="mt-4 space-y-3">
          {((replies ?? []) as unknown as Reply[]).map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-2 text-sm text-muted">
                <span>
                  <span className="font-medium text-ink">{r.author ? `@${r.author.username}` : "deleted user"}</span>{" "}
                  · {timeAgo(r.created_at)}
                </span>
                {user?.id === r.author_id && <DeleteReplyButton replyId={r.id} threadId={thread.id} />}
              </div>
              <p className="mt-2 leading-relaxed whitespace-pre-line">{r.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {user ? (
            <ReplyForm threadId={thread.id} />
          ) : (
            <p className="card p-4 text-sm text-muted">
              <Link href={`/login?next=/forum/${thread.id}`} className="text-accent underline">
                Sign in
              </Link>{" "}
              to join the discussion.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
