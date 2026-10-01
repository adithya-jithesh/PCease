"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { headlineSpecs, slotNoun } from "@/lib/catalog";
import { analyzeBuild } from "@/lib/compat";
import { formatINR } from "@/lib/format";
import type { Category, Part, ResolvedBuild } from "@/lib/types";

interface Props {
  slot: Category;
  parts: Part[];
  current: ResolvedBuild;
  onPick: (part: Part) => void;
  onClose: () => void;
}

/** Errors introduced by putting `candidate` in `slot`, given the rest of the build. */
function conflictsFor(slot: Category, candidate: Part, current: ResolvedBuild) {
  const rest = { ...current, [slot]: undefined };
  const before = new Set(analyzeBuild(rest).checks.filter((c) => c.level === "error").map((c) => c.title));
  return analyzeBuild({ ...rest, [slot]: candidate }).checks.filter(
    (c) => c.level === "error" && !before.has(c.title),
  );
}

export function PartPicker({ slot, parts, current, onPick, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [compatibleOnly, setCompatibleOnly] = useState(true);

  // Keep the latest onClose without re-running the effect below.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Open as a modal on mount. Listen for the native `close` event directly so
  // Escape, the close button and picking a part all hand control back to the
  // parent, whichever way the dialog was dismissed.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const handleClose = () => onCloseRef.current();
    el.addEventListener("close", handleClose);
    if (!el.open) el.showModal();
    return () => el.removeEventListener("close", handleClose);
  }, []);

  const close = () => {
    dialog.current?.close();
    onClose();
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return parts
      .filter((p) => p.category === slot)
      .filter((p) => !term || `${p.brand} ${p.name}`.toLowerCase().includes(term))
      .map((p) => ({ part: p, conflicts: conflictsFor(slot, p, current) }))
      .filter((r) => !compatibleOnly || r.conflicts.length === 0);
  }, [parts, slot, q, current, compatibleOnly]);

  return (
    <dialog
      ref={dialog}
      onClick={(e) => e.target === dialog.current && close()}
      className="m-auto h-[min(85vh,720px)] w-[min(100vw-2rem,720px)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-line p-4">
          <h2 className="font-display text-lg font-semibold">Choose {slotNoun(slot)}</h2>
          <button onClick={close} className="btn-ghost ml-auto px-2" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="input pl-9" />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={compatibleOnly}
              onChange={(e) => setCompatibleOnly(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Compatible only
          </label>
        </div>
        <ul className="flex-1 divide-y divide-line overflow-y-auto">
          {rows.map(({ part, conflicts }) => (
            <li key={part.id}>
              <button
                onClick={() => {
                  onPick(part);
                  close();
                }}
                className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{part.brand}</p>
                  <p className="font-medium">{part.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {headlineSpecs(part).map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                  {conflicts.map((c) => (
                    <p key={c.title} className="mt-1.5 text-xs text-err">{c.detail}</p>
                  ))}
                </div>
                <span className="font-mono font-semibold">{formatINR(part.best_price)}</span>
              </button>
            </li>
          ))}
          {!rows.length && (
            <li className="p-8 text-center text-sm text-muted">
              No parts match.{" "}
              {compatibleOnly && (
                <button onClick={() => setCompatibleOnly(false)} className="text-accent underline">
                  Show incompatible parts too
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </dialog>
  );
}
