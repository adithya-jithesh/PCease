import type { Metadata } from "next";
import { Suspense } from "react";
import { PartCard } from "@/components/part-card";
import { CATEGORY_META } from "@/lib/catalog";
import { listBrands, listParts, type SortKey } from "@/lib/data";
import { CATEGORIES, type Category } from "@/lib/types";
import { Filters } from "./filters";

export const metadata: Metadata = { title: "Parts" };

const SORTS: SortKey[] = ["popular", "price-asc", "price-desc", "name"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function PartsPage({ searchParams }: PageProps<"/parts">) {
  const params = await searchParams;
  const rawCategory = one(params.category);
  const category = CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : undefined;
  const rawSort = one(params.sort) as SortKey | undefined;
  const max = Number(one(params.max));

  const [parts, brands] = await Promise.all([
    listParts({
      category,
      q: one(params.q),
      brand: one(params.brand),
      maxPrice: Number.isFinite(max) && max > 0 ? max : undefined,
      sort: rawSort && SORTS.includes(rawSort) ? rawSort : "popular",
    }),
    listBrands(category),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow">Catalogue</p>
      <h1 className="mt-2 font-display text-3xl font-bold">
        {category ? CATEGORY_META[category].plural : "All parts"}
      </h1>

      <div className="mt-6">
        <Suspense>
          <Filters brands={brands} />
        </Suspense>
      </div>

      <p className="mt-6 font-mono text-xs text-muted">
        {parts.length} {parts.length === 1 ? "result" : "results"}
      </p>

      {parts.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      ) : (
        <div className="card mt-3 p-10 text-center text-muted">
          Nothing matches those filters. Try widening the price range or clearing the search.
        </div>
      )}
    </div>
  );
}
