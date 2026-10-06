import Link from "next/link";
import { CATEGORY_META, headlineSpecs } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import type { Part } from "@/lib/types";
import { CategoryIcon } from "./category-icon";
import { AddToBuildButton, CompareToggle } from "./part-actions";

export function PartCard({ part }: { part: Part }) {
  return (
    <article className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
          <CategoryIcon category={part.category} className="size-3.5" />
          {CATEGORY_META[part.category].label}
        </span>
        {part.offer_count > 0 && (
          <span className="font-mono text-[11px] text-muted">{part.offer_count} stores</span>
        )}
      </div>
      <Link href={`/parts/${part.slug}`} className="mt-3 block flex-1">
        <p className="text-xs text-muted">{part.brand}</p>
        <h3 className="font-display leading-snug font-semibold group-hover:text-accent">{part.name}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {headlineSpecs(part).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </Link>
      <div className="mt-4 border-t border-line pt-3">
        <p className="font-mono text-lg font-semibold">
          <span className="mr-1.5 font-sans text-[11px] font-normal text-muted">from</span>
          {formatINR(part.best_price)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <CompareToggle id={part.id} name={part.name} />
          <AddToBuildButton id={part.id} category={part.category} name={part.name} compact />
        </div>
      </div>
    </article>
  );
}
