"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { FORUM_TOPICS } from "@/lib/types";
import { createThread, type FormState } from "../actions";
import { TOPIC_LABELS } from "../topics";

export function NewThreadForm({ builds }: { builds: { id: string; title: string; is_public: boolean }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createThread, {});

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Title</span>
        <input name="title" required minLength={5} maxLength={160} className="input" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Topic</span>
        <select name="topic" defaultValue="build-help" className="input">
          {FORUM_TOPICS.map((t) => (
            <option key={t} value={t}>
              {TOPIC_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Details</span>
        <textarea name="body" required minLength={10} maxLength={10000} rows={8} className="input" />
      </label>
      {builds.length > 0 && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Attach a build (optional)</span>
          <select name="build_id" defaultValue="" className="input">
            <option value="">None</option>
            {builds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
                {b.is_public ? "" : " (private: make it public so others can see it)"}
              </option>
            ))}
          </select>
        </label>
      )}
      {state.error && <p role="alert" className="rounded-xl bg-err-soft px-3 py-2 text-sm text-err">{state.error}</p>}
      <button disabled={pending} className="btn-primary">
        {pending && <Loader2 className="size-4 animate-spin" />} Post thread
      </button>
    </form>
  );
}
