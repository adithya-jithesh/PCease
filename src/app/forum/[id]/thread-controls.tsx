"use client";

import { useActionState, useEffect, useOptimistic, useRef, useTransition } from "react";
import { ArrowBigDown, ArrowBigUp, Loader2, Trash2 } from "lucide-react";
import { submitWithoutReset } from "@/lib/forms";
import { createReply, deleteReply, deleteThread, vote, type FormState } from "../actions";

export function VoteButtons({ threadId, score, myVote }: { threadId: number; score: number; myVote: number }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({ score, myVote });

  const cast = (value: 1 | -1) =>
    startTransition(async () => {
      const next = optimistic.myVote === value ? 0 : value;
      setOptimistic({ score: optimistic.score - optimistic.myVote + next, myVote: next });
      await vote(threadId, value);
    });

  return (
    <div className="flex w-10 shrink-0 flex-col items-center font-mono text-sm">
      <button onClick={() => cast(1)} aria-label="Upvote" aria-pressed={optimistic.myVote === 1}>
        <ArrowBigUp className={`size-6 ${optimistic.myVote === 1 ? "fill-accent text-accent" : "text-muted hover:text-ink"}`} />
      </button>
      <span>{optimistic.score}</span>
      <button onClick={() => cast(-1)} aria-label="Downvote" aria-pressed={optimistic.myVote === -1}>
        <ArrowBigDown className={`size-6 ${optimistic.myVote === -1 ? "fill-err text-err" : "text-muted hover:text-ink"}`} />
      </button>
    </div>
  );
}

export function ReplyForm({ threadId }: { threadId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReply, {});
  const form = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Clear the box after a successful post.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) form.current?.reset();
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={form} onSubmit={submitWithoutReset(action)} className="space-y-2">
      <input type="hidden" name="thread_id" value={threadId} />
      <textarea name="body" required maxLength={5000} rows={4} placeholder="Write a reply…" className="input" />
      {state.error && <p className="text-sm text-err">{state.error}</p>}
      <button disabled={pending} className="btn-primary">
        {pending && <Loader2 className="size-4 animate-spin" />} Reply
      </button>
    </form>
  );
}

function ConfirmDelete({ label, onConfirm }: { label: string; onConfirm: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete this ${label}? This can't be undone.`)) startTransition(onConfirm);
      }}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-err"
    >
      <Trash2 className="size-3.5" /> Delete
    </button>
  );
}

export function DeleteThreadButton({ threadId }: { threadId: number }) {
  return (
    <div className="mt-4">
      <ConfirmDelete label="thread" onConfirm={() => deleteThread(threadId)} />
    </div>
  );
}

export function DeleteReplyButton({ replyId, threadId }: { replyId: number; threadId: number }) {
  return <ConfirmDelete label="reply" onConfirm={() => deleteReply(replyId, threadId)} />;
}
