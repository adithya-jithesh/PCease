import Link from "next/link";
import { Zap } from "lucide-react";
import { CATEGORY_META } from "@/lib/catalog";
import { analyzeBuild } from "@/lib/compat";
import { formatINR } from "@/lib/format";
import { CATEGORIES, type ResolvedBuild } from "@/lib/types";
import { BuildChecks, StatusPill } from "./build-checks";

/** Read-only view of a build, used for shared links and public builds. */
export function BuildSheet({ build }: { build: ResolvedBuild }) {
  const analysis = analyzeBuild(build);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <ul className="card divide-y divide-line">
        {CATEGORIES.filter((slot) => build[slot]).map((slot) => {
          const part = build[slot]!;
          return (
            <li key={slot} className="flex items-center gap-4 p-4">
              <span className="w-24 shrink-0 font-mono text-xs text-muted">{CATEGORY_META[slot].label}</span>
              <Link href={`/parts/${part.slug}`} className="min-w-0 flex-1 font-medium hover:underline">
                {part.brand} {part.name}
              </Link>
              <span className="font-mono">{formatINR(part.best_price)}</span>
            </li>
          );
        })}
      </ul>
      <aside className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Total today</p>
            <StatusPill checks={analysis.checks} />
          </div>
          <p className="font-mono text-3xl font-semibold">{formatINR(analysis.total)}</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
            <Zap className="size-4 text-accent" /> ~{analysis.estimatedWatts} W estimated load
          </p>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-display font-semibold">Compatibility</h2>
          <BuildChecks checks={analysis.checks} />
        </div>
      </aside>
    </div>
  );
}
