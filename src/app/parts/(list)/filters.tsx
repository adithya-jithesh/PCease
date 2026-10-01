"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { CATEGORY_META } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/types";

export function Filters({ brands }: { brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  // Debounce typing into the search box.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const category = params.get("category");

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => update({ category: null, brand: null })}
          className={`btn shrink-0 ${!category ? "bg-accent-soft text-accent" : "btn-outline"}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => update({ category: c, brand: null })}
            className={`btn shrink-0 ${category === c ? "bg-accent-soft text-accent" : "btn-outline"}`}
          >
            {CATEGORY_META[c].plural}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search parts</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or brand"
            className="input pl-9"
          />
          {pending && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" />
          )}
        </label>
        <select
          aria-label="Brand"
          value={params.get("brand") ?? ""}
          onChange={(e) => update({ brand: e.target.value || null })}
          className="input sm:w-44"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select
          aria-label="Maximum price"
          value={params.get("max") ?? ""}
          onChange={(e) => update({ max: e.target.value || null })}
          className="input sm:w-40"
        >
          <option value="">Any price</option>
          {[5000, 10000, 20000, 30000, 50000, 75000].map((p) => (
            <option key={p} value={p}>
              Under ₹{p.toLocaleString("en-IN")}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={params.get("sort") ?? "popular"}
          onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })}
          className="input sm:w-44"
        >
          <option value="popular">Most stocked</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>
    </div>
  );
}
