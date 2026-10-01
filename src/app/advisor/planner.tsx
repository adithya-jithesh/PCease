"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { BuildChecks } from "@/components/build-checks";
import { OpenInBuilder } from "@/components/open-in-builder";
import { CATEGORY_META } from "@/lib/catalog";
import { analyzeBuild } from "@/lib/compat";
import { formatINR } from "@/lib/format";
import { planBuild, USE_CASES, type UseCase } from "@/lib/planner";
import { CATEGORIES, type Part } from "@/lib/types";

const PRESETS = [40000, 60000, 80000, 100000, 150000, 200000];

export function Planner({ parts }: { parts: Part[] }) {
  const [budget, setBudget] = useState(80000);
  const [useCase, setUseCase] = useState<UseCase>("gaming");

  const plan = useMemo(() => planBuild(parts, budget, useCase), [parts, budget, useCase]);
  const analysis = plan ? analyzeBuild(plan.build) : null;
  const selection = plan
    ? Object.fromEntries(Object.entries(plan.build).map(([slot, p]) => [slot, p!.id]))
    : {};

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="card space-y-6 p-5">
        <fieldset>
          <legend className="text-sm font-medium">Use case</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(USE_CASES) as UseCase[]).map((key) => (
              <button
                key={key}
                onClick={() => setUseCase(key)}
                aria-pressed={useCase === key}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  useCase === key ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-ink"
                }`}
              >
                {USE_CASES[key].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="budget" className="flex items-baseline justify-between text-sm font-medium">
            Budget <span className="font-mono text-lg">{formatINR(budget)}</span>
          </label>
          <input
            id="budget"
            type="range"
            min={30000}
            max={300000}
            step={5000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--accent)]"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setBudget(p)}
                className={`chip hover:border-ink ${budget === p ? "border-ink text-ink" : ""}`}
              >
                {p >= 100000 ? `${p / 100000}L` : `${p / 1000}k`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {plan && analysis ? (
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Planned total</p>
              <p className="font-mono text-3xl font-semibold">{formatINR(plan.total)}</p>
              <p className="text-sm text-ok">{formatINR(plan.leftover)} under budget</p>
            </div>
            <OpenInBuilder selection={selection} label="Customise in builder" />
          </div>

          <ul className="mt-6 divide-y divide-line border-y border-line">
            {CATEGORIES.map((slot) => {
              const part = plan.build[slot];
              return (
                <li key={slot} className="flex items-center gap-4 py-3 text-sm">
                  <span className="w-24 shrink-0 font-mono text-xs text-muted">{CATEGORY_META[slot].label}</span>
                  {part ? (
                    <>
                      <Link href={`/parts/${part.slug}`} className="min-w-0 flex-1 font-medium hover:underline">
                        {part.brand} {part.name}
                      </Link>
                      <span className="font-mono">{formatINR(part.best_price)}</span>
                    </>
                  ) : (
                    <span className="flex-1 text-muted">Not needed</span>
                  )}
                </li>
              );
            })}
          </ul>

          {plan.notes.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {plan.notes.map((n) => (
                <li key={n} className="flex gap-2 text-sm text-muted">
                  <Info className="mt-0.5 size-4 shrink-0 text-accent" /> {n}
                </li>
              ))}
            </ul>
          )}

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted hover:text-ink">Compatibility report</summary>
            <div className="mt-3">
              <BuildChecks checks={analysis.checks} />
            </div>
          </details>
        </div>
      ) : (
        <div className="card grid place-items-center p-10 text-center text-muted">
          That budget is too tight for a complete build from the current catalogue. Try raising it.
        </div>
      )}
    </div>
  );
}
