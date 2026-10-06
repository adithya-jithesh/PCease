import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/category-icon";
import { isAdmin } from "@/lib/admin";
import { formatINR, timeAgo } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { ListingEditor, RefreshPartButton, RefreshStalestButton } from "./controls";

export const metadata: Metadata = { title: "Price admin", robots: { index: false } };
// Refresh actions run several AI lookups.
export const maxDuration = 120;

interface ListingRow {
  retailer_id: number;
  price_inr: number;
  in_stock: boolean;
  source: string;
  updated_at: string;
  retailer: { name: string } | null;
}

const SOURCE_STYLE: Record<string, string> = {
  ai: "border-accent/40 text-accent",
  manual: "border-warn/40 text-warn",
  seed: "",
};

export default async function PriceAdminPage() {
  if (!isAdmin(await getUser())) notFound();

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Price admin</h1>
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {err instanceof Error ? err.message : "The service key is missing."}
        </p>
      </div>
    );
  }

  const [{ data: runs }, { data: parts }] = await Promise.all([
    db.from("price_runs").select("*").order("started_at", { ascending: false }).limit(5),
    db
      .from("parts")
      .select(
        "id, slug, brand, name, category, prices_checked_at, listings(retailer_id, price_inr, in_stock, source, updated_at, retailer:retailers(name))",
      )
      .order("category")
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Prices</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        A daily job refreshes the parts checked longest ago using Gemini with Google Search. Prices are
        only accepted from the store&apos;s own site and within a sensible range of the current price.
        Anything you edit here is marked <span className="chip border-warn/40 text-warn">manual</span>.
      </p>

      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display font-semibold">Recent runs</h2>
          <RefreshStalestButton />
        </div>
        {runs?.length ? (
          <ul className="mt-4 divide-y divide-line text-sm">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="chip mr-2">{r.trigger}</span>
                  {timeAgo(r.started_at)}
                  {!r.finished_at && <span className="ml-2 text-warn">(didn&apos;t finish)</span>}
                </span>
                <span className="font-mono text-muted">
                  {r.checked} checked · <span className="text-ok">{r.updated} updated</span> · {r.rejected} rejected
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No runs yet.</p>
        )}
      </section>

      <section className="mt-8 space-y-2">
        {(parts ?? []).map((part) => {
          const listings = ((part.listings ?? []) as unknown as ListingRow[]).sort((a, b) => a.price_inr - b.price_inr);
          const best = listings.find((l) => l.in_stock)?.price_inr ?? null;
          return (
            <details key={part.id} className="card group">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <CategoryIcon category={part.category as Category} className="size-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {part.brand} {part.name}
                </span>
                <span className="hidden text-xs text-muted sm:block">
                  {part.prices_checked_at ? `checked ${timeAgo(part.prices_checked_at)}` : "never checked"}
                </span>
                <span className="font-mono text-sm">{formatINR(best)}</span>
              </summary>
              <div className="border-t border-line p-4">
                <div className="mb-3 flex justify-end">
                  <RefreshPartButton slug={part.slug} />
                </div>
                <ul className="space-y-2">
                  {listings.map((l) => (
                    <li key={l.retailer_id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        {l.retailer?.name}
                        <span className={`chip ${SOURCE_STYLE[l.source] ?? ""}`}>{l.source}</span>
                        <span className="text-xs text-muted">{timeAgo(l.updated_at)}</span>
                      </span>
                      <ListingEditor
                        partId={part.id}
                        retailerId={l.retailer_id}
                        price={l.price_inr}
                        inStock={l.in_stock}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
