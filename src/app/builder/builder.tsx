"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Copy, Loader2, Plus, RotateCcw, Save, Sparkles, Trash2, Zap } from "lucide-react";
import { BuildChecks, StatusPill } from "@/components/build-checks";
import { CategoryTile } from "@/components/category-icon";
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

  const filled = CATEGORIES.filter((slot) => resolved[slot]).length;
  const hasErrors = analysis.checks.some((c) => c.level === "error");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-28 lg:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{editing ? "Editing saved build" : "Builder"}</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{editing?.title ?? "Your build"}</h1>
          <p className="mt-1 text-sm text-muted">
            Pick a part for each slot. We&apos;ll check that everything fits together as you go.
          </p>
        </div>
        {count > 0 && (
          <button onClick={clear} className="btn-ghost text-muted">
            <RotateCcw className="size-4" /> Start over
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className={`h-full rounded-full transition-all duration-500 ${hasErrors ? "bg-err" : "bg-accent"}`}
            style={{ width: `${(filled / CATEGORIES.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs text-muted">
          {filled}/{CATEGORIES.length} parts
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ol className="space-y-2">
          {CATEGORIES.map((slot) => {
            const part = resolved[slot];
            return (
              <li
                key={slot}
                className={`card flex items-center gap-4 p-3 transition sm:p-4 ${part ? "" : "border-dashed bg-transparent"}`}
              >
                <CategoryTile category={slot} className={part ? "" : "bg-surface-2 text-muted"} />
                {part ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-muted">{CATEGORY_META[slot].label}</p>
                      <Link href={`/parts/${part.slug}`} className="font-medium hover:text-accent">
                        {part.brand} {part.name}
                      </Link>
                      <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
                        {headlineSpecs(part).map((s) => (
                          <span key={s} className="chip">{s}</span>
                        ))}
                      </div>
                      <p className="font-mono text-sm font-semibold sm:hidden">{formatINR(part.best_price)}</p>
                    </div>
                    <span className="hidden font-mono font-semibold sm:block">{formatINR(part.best_price)}</span>
                    <div className="flex">
                      <button onClick={() => setPicking(slot)} className="btn-ghost px-2.5 text-xs text-muted">
                        Swap
                      </button>
                      <button
                        onClick={() => setPart(slot, null)}
                        className="btn-ghost px-2 text-muted hover:text-err"
                        aria-label={`Remove ${CATEGORY_META[slot].label}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setPicking(slot)}
                    className="group flex flex-1 items-center justify-between gap-2 text-left text-sm"
                  >
                    <span>
                      <span className="block font-medium text-ink group-hover:text-accent">
                        Choose {slotNoun(slot)}
                      </span>
                      <span className="text-xs text-muted">{CATEGORY_META[slot].blurb}</span>
                    </span>
                    <span className="grid size-8 place-items-center rounded-full border border-line text-muted transition group-hover:border-accent group-hover:text-accent">
                      <Plus className="size-4" />
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {count === 0 ? (
            <div className="card glow p-5">
              <h2 className="font-display text-lg font-semibold">Not sure where to start?</h2>
              <p className="mt-2 text-sm text-muted">
                Most builds start with the CPU, since it decides which motherboard and memory fit. Or
                let the advisor draft a whole build for your budget and tweak it here.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button onClick={() => setPicking("cpu")} className="btn-primary">
                  <Plus className="size-4" /> Pick a CPU
                </button>
                <Link href="/advisor" className="btn-outline">
                  <Sparkles className="size-4" /> Plan with the AI advisor
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">Total</p>
                  <StatusPill checks={analysis.checks} />
                </div>
                <p className="font-mono text-3xl font-semibold">{formatINR(analysis.total)}</p>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                  <Zap className="size-4 text-accent" />
                  ~{analysis.estimatedWatts} W load · {analysis.recommendedPsu} W PSU recommended
                </p>
                {analysis.missing.length > 0 && (
                  <p className="mt-2 text-sm text-muted">
                    Still needed: {analysis.missing.map((m) => CATEGORY_META[m].label).join(", ")}
                  </p>
                )}
              </div>

              <div className="card p-5">
                <h2 className="mb-4 font-display font-semibold">Compatibility</h2>
                <BuildChecks checks={analysis.checks} />
              </div>

              <BuildActions build={build} signedIn={signedIn} editing={editing} />
            </>
          )}
        </aside>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-semibold">{formatINR(analysis.total)}</p>
              <p className="text-xs text-muted">
                {filled}/{CATEGORIES.length} parts · ~{analysis.estimatedWatts} W
              </p>
            </div>
            <StatusPill checks={analysis.checks} />
          </div>
        </div>
      )}

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
