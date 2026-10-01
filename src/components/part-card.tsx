import Link from "next/link";
import { CATEGORY_META, headlineSpecs } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import type { Part } from "@/lib/types";
import { AddToBuildButton, CompareToggle } from "./part-actions";

export function PartCard({ part }: { part: Part }) {
  return (
    <article className="card flex flex-col p-4 transition hover:border-ink/40">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] text-accent">{CATEGORY_META[part.category].label}</span>
        {part.offer_count > 0 && (
          <span className="font-mono text-[11px] text-muted">{part.offer_count} stores</span>
        )}
      </div>
      <Link href={`/parts/${part.slug}`} className="mt-3 block flex-1">
        <p className="text-xs text-muted">{part.brand}</p>
        <h3 className="font-display leading-snug font-semibold hover:underline">{part.name}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {headlineSpecs(part).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </Link>
      <div className="mt-4 flex items-end justify-between gap-2 border-t border-line pt-3">
        <div>
          <p className="text-[11px] text-muted">from</p>
          <p className="font-mono text-lg font-semibold">{formatINR(part.best_price)}</p>
        </div>
        <div className="flex items-center gap-1">
          <CompareToggle id={part.id} />
          <AddToBuildButton id={part.id} category={part.category} compact />
        </div>
      </div>
    </article>
  );
}
