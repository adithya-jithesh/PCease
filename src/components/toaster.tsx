"use client";

import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { dismissToast, useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm animate-[toast-in_180ms_ease-out] items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm shadow-xl shadow-black/40"
        >
          <CheckCircle2 className={`size-4 shrink-0 ${t.tone === "success" ? "text-ok" : "text-accent"}`} />
          <p className="min-w-0 flex-1">{t.message}</p>
          {t.action && (
            <Link
              href={t.action.href}
              onClick={() => dismissToast(t.id)}
              className="shrink-0 font-medium text-accent hover:underline"
            >
              {t.action.label}
            </Link>
          )}
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
