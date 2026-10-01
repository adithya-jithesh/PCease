"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Copy, Loader2, Plus, RotateCcw, Save, Trash2, Zap } from "lucide-react";
import { BuildChecks, StatusPill } from "@/components/build-checks";
import { CATEGORY_META, headlineSpecs, slotNoun } from "@/lib/catalog";
import { analyzeBuild } from "@/lib/compat";
import { formatINR } from "@/lib/format";
import { encodeSelection } from "@/lib/share";
import { useBuild } from "@/lib/stores";
import { CATEGORIES, type BuildSelection, type Category, type Part, type ResolvedBuild } from "@/lib/types";
import { PartPicker } from "./part-picker";
import { saveBuild } from "./actions";

interface Editing {
  id: string;
  title: string;
  notes: string | null;
  is_public: boolean;
  parts: BuildSelection;
}

export function Builder({
  parts,
  signedIn,
  editing,
}: {
  parts: Part[];
  signedIn: boolean;
  editing: Editing | null;
}) {
  const { build, setPart, replace, clear } = useBuild();
  const [picking, setPicking] = useState<Category | null>(null);
  const loadedEdit = useRef(false);

  // Opening a saved build loads it into the working build once.
  useEffect(() => {
    if (editing && !loadedEdit.current) {
      loadedEdit.current = true;
      replace(editing.parts);
    }
  }, [editing, replace]);

  const byId = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const resolved = useMemo(() => {
    const out: ResolvedBuild = {};
    for (const slot of CATEGORIES) {
      const p = build[slot] ? byId.get(build[slot]!) : undefined;
      if (p) out[slot] = p;
    }
    return out;
  }, [build, byId]);
  const analysis = useMemo(() => analyzeBuild(resolved), [resolved]);
  const count = Object.keys(resolved).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{editing ? "Editing saved build" : "Builder"}</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{editing?.title ?? "Your build"}</h1>
        </div>
        {count > 0 && (
          <button onClick={clear} className="btn-ghost text-muted">
            <RotateCcw className="size-4" /> Start over
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ol className="space-y-2">
          {CATEGORIES.map((slot) => {
            const part = resolved[slot];
            return (
              <li key={slot} className="card flex items-center gap-4 p-4">
                <span className="w-24 shrink-0 font-mono text-xs text-muted sm:w-28">
                  {CATEGORY_META[slot].label}
                </span>
                {part ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <Link href={`/parts/${part.slug}`} className="font-medium hover:underline">
                        {part.brand} {part.name}
                      </Link>
                      <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
                        {headlineSpecs(part).map((s) => (
                          <span key={s} className="chip">{s}</span>
                        ))}
                      </div>
                    </div>
                    <span className="hidden font-mono font-semibold sm:block">{formatINR(part.best_price)}</span>
                    <div className="flex">
                      <button onClick={() => setPicking(slot)} className="btn-ghost px-2 text-xs text-muted">
                        Swap
                      </button>
                      <button
                        onClick={() => setPart(slot, null)}
                        className="btn-ghost px-2 text-muted"
                        aria-label={`Remove ${CATEGORY_META[slot].label}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setPicking(slot)}
                    className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
                  >
                    <Plus className="size-4" /> Choose {slotNoun(slot)}
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Total</p>
              {count > 0 && <StatusPill checks={analysis.checks} />}
            </div>
            <p className="font-mono text-3xl font-semibold">{formatINR(analysis.total)}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <Zap className="size-4 text-accent" />
              ~{analysis.estimatedWatts} W load · {analysis.recommendedPsu} W PSU recommended
            </p>
            {analysis.missing.length > 0 && count > 0 && (
              <p className="mt-2 text-sm text-muted">
                Still needed: {analysis.missing.map((m) => CATEGORY_META[m].label).join(", ")}
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-display font-semibold">Compatibility</h2>
            <BuildChecks checks={analysis.checks} />
          </div>

          {count > 0 && <BuildActions build={build} signedIn={signedIn} editing={editing} />}
        </aside>
      </div>

      {picking && (
        <PartPicker
          key={picking}
          slot={picking}
          parts={parts}
          current={resolved}
          onPick={(p) => setPart(picking, p.id)}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

function BuildActions({
  build,
  signedIn,
  editing,
}: {
  build: BuildSelection;
  signedIn: boolean;
  editing: Editing | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [isPublic, setIsPublic] = useState(editing?.is_public ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const copyLink = async () => {
    const url = `${window.location.origin}/share?p=${encodeURIComponent(encodeSelection(build))}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = () =>
    startTransition(async () => {
      setError(null);
      const res = await saveBuild({
        id: editing?.id,
        title: title || "Untitled build",
        notes: editing?.notes ?? undefined,
        isPublic,
        parts: build,
      });
      if (!res.ok) return setError(res.error);
      setSaved(true);
      if (!editing) router.replace(`/builder?build=${res.id}`);
      setTimeout(() => setSaved(false), 2500);
    });

  return (
    <div className="card space-y-3 p-5">
      <button onClick={copyLink} className="btn-outline w-full">
        {copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
        {copied ? "Link copied" : "Copy share link"}
      </button>

      {signedIn ? (
        <div className="space-y-2 border-t border-line pt-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Build name"
            maxLength={80}
            className="input"
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Public (anyone with the link can view)
          </label>
          <button onClick={save} disabled={pending} className="btn-primary w-full">
            {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : <Save className="size-4" />}
            {saved ? "Saved" : editing ? "Save changes" : "Save build"}
          </button>
          {error && <p className="text-sm text-err">{error}</p>}
        </div>
      ) : (
        <p className="border-t border-line pt-3 text-sm text-muted">
          <Link href="/login?next=/builder" className="text-accent underline">
            Sign in
          </Link>{" "}
          to save builds to your dashboard.
        </p>
      )}
    </div>
  );
}
