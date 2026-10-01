import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_META, formatSpec } from "@/lib/catalog";
import { getPartsByIds } from "@/lib/data";
import { formatINR } from "@/lib/format";
import type { Part } from "@/lib/types";
import { CompareSync, RemoveButton } from "./compare-controls";
import { AddToBuildButton } from "@/components/part-actions";

export const metadata: Metadata = { title: "Compare" };

function bestIndexes(values: (number | null)[], better: "higher" | "lower"): Set<number> {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length < 2 || new Set(nums).size === 1) return new Set();
  const target = better === "higher" ? Math.max(...nums) : Math.min(...nums);
  return new Set(values.flatMap((v, i) => (v === target ? [i] : [])));
}

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const { ids: raw } = await searchParams;
  const ids = (typeof raw === "string" ? raw.split(",") : [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 4);

  const found = await getPartsByIds(ids);
  // Keep the order the user picked them in.
  const parts = ids.map((id) => found.find((p) => p.id === id)).filter(Boolean) as Part[];

  if (!parts.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <CompareSync ids={[]} />
        <p className="eyebrow">Compare</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Side-by-side comparison</h1>
        <div className="card mt-8 p-10 text-center text-muted">
          Pick up to four parts with the <span className="font-medium text-ink">Compare</span> button
          while browsing.{" "}
          <Link href="/parts" className="text-accent underline">
            Browse parts
          </Link>
        </div>
      </div>
    );
  }

  const categories = new Set(parts.map((p) => p.category));
  const sameCategory = categories.size === 1;
  const fields = sameCategory ? CATEGORY_META[parts[0].category].fields : [];
  const priceBest = bestIndexes(parts.map((p) => p.best_price), "lower");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <CompareSync ids={parts.map((p) => p.id)} />
      <p className="eyebrow">Compare</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Side-by-side comparison</h1>
      {!sameCategory && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
          These parts are from different categories, so only prices are compared.
        </p>
      )}

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-40 p-4 text-left font-normal text-muted" />
              {parts.map((p) => (
                <th key={p.id} className="p-4 text-left align-top font-normal">
                  <p className="font-mono text-[11px] text-accent">{CATEGORY_META[p.category].label}</p>
                  <Link href={`/parts/${p.slug}`} className="mt-1 block font-display font-semibold hover:underline">
                    {p.brand} {p.name}
                  </Link>
                  <RemoveButton id={p.id} remaining={parts.map((x) => x.id).filter((x) => x !== p.id)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="p-4 text-muted">Best price</td>
              {parts.map((p, i) => (
                <td key={p.id} className={`p-4 font-mono font-semibold ${priceBest.has(i) ? "text-ok" : ""}`}>
                  {formatINR(p.best_price)}
                </td>
              ))}
            </tr>
            {fields.map((f) => {
              const values = parts.map((p) => p.specs[f.key]);
              const best = f.better
                ? bestIndexes(values.map((v) => (typeof v === "number" ? v : null)), f.better)
                : new Set<number>();
              return (
                <tr key={f.key}>
                  <td className="p-4 text-muted">{f.label}</td>
                  {parts.map((p, i) => (
                    <td key={p.id} className={`p-4 font-mono ${best.has(i) ? "font-semibold text-ok" : ""}`}>
                      {formatSpec(p.category, f.key, p.specs[f.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
            {sameCategory && parts.some((p) => p.watts != null) && (
              <tr>
                <td className="p-4 text-muted">Power draw</td>
                {parts.map((p) => (
                  <td key={p.id} className="p-4 font-mono">{p.watts != null ? `${p.watts} W` : "—"}</td>
                ))}
              </tr>
            )}
            <tr>
              <td className="p-4" />
              {parts.map((p) => (
                <td key={p.id} className="p-4">
                  <AddToBuildButton id={p.id} category={p.category} compact />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
