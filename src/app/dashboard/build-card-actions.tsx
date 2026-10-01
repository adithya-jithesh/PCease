"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Copy, Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteBuild, duplicateBuild, setBuildVisibility } from "./actions";

export function BuildCardActions({ id, isPublic }: { id: string; isPublic: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
      <Link href={`/builder?build=${id}`} className="btn-ghost px-2.5 text-xs">
        <Pencil className="size-3.5" /> Edit
      </Link>
      <button
        disabled={pending}
        onClick={() => startTransition(() => setBuildVisibility(id, !isPublic))}
        className="btn-ghost px-2.5 text-xs"
      >
        {isPublic ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {isPublic ? "Make private" : "Make public"}
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => duplicateBuild(id))}
        className="btn-ghost px-2.5 text-xs"
        aria-label="Duplicate"
      >
        <Copy className="size-3.5" />
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this build? This can't be undone.")) startTransition(() => deleteBuild(id));
        }}
        className="btn-ghost ml-auto px-2.5 text-xs text-muted hover:text-err"
        aria-label="Delete"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </button>
    </div>
  );
}
