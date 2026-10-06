import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AddToBuildButton, CompareToggle } from "@/components/part-actions";
import { CATEGORY_META, formatSpec } from "@/lib/catalog";
import { getPart, getPriceHistory } from "@/lib/data";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { CategoryIcon } from "@/components/category-icon";
import { formatINR, retailerLink, timeAgo } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/parts/[slug]">): Promise<Metadata> {
  const part = await getPart((await params).slug);
  if (!part) return {};
  return {
    title: `${part.brand} ${part.name}`,
    description: `Compare ${part.brand} ${part.name} prices across Indian retailers, from ${formatINR(part.best_price)}.`,
  };
}

export default async function PartPage({ params }: PageProps<"/parts/[slug]">) {
  const part = await getPart((await params).slug);
  if (!part) notFound();

  const meta = CATEGORY_META[part.category];
  const history = await getPriceHistory(part.id);
  const inStock = part.listings.filter((l) => l.in_stock);
  const best = inStock[0];
  const worst = inStock[inStock.length - 1];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href={`/parts?category=${part.category}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> {meta.plural}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-xs text-accent">
            <CategoryIcon category={part.category} className="size-3.5" /> {meta.label}
          </p>
          <p className="mt-2 text-muted">{part.brand}</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{part.name}</h1>

          <div className="mt-6 flex flex-wrap gap-2">
            <AddToBuildButton id={part.id} category={part.category} name={part.name} goToBuilder />
            <CompareToggle id={part.id} name={part.name} />
          </div>

          <h2 className="mt-10 font-display text-xl font-semibold">Specifications</h2>
          <dl className="card mt-3 divide-y divide-line">
            {meta.fields
              .filter((f) => part.specs[f.key] != null)
              .map((f) => (
                <div key={f.key} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted">{f.label}</dt>
                  <dd className="text-right font-mono">{formatSpec(part.category, f.key, part.specs[f.key])}</dd>
                </div>
              ))}
            {part.watts != null && (
              <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">Typical power draw</dt>
                <dd className="font-mono">{part.watts} W</dd>
              </div>
            )}
          </dl>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-sm text-muted">Best price</p>
            <p className="font-mono text-3xl font-semibold">{formatINR(best?.price_inr)}</p>
            {best && worst && worst.price_inr > best.price_inr && (
              <p className="mt-1 text-sm text-ok">
                Save {formatINR(worst.price_inr - best.price_inr)} vs. the priciest store
              </p>
            )}

            <div className="mt-5 border-t border-line pt-4">
              <PriceHistoryChart series={history} />
            </div>

            <ul className="mt-5 space-y-2">
              {part.listings.map((l, i) => (
                <li key={l.retailer.id}>
                  <a
                    href={l.url ?? retailerLink(l.retailer.search_url, part.name, part.brand)}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition hover:border-ink ${
                      i === 0 && l.in_stock ? "border-accent bg-accent-soft" : "border-line"
                    } ${l.in_stock ? "" : "opacity-50"}`}
                  >
                    <span className="flex items-center gap-2">
                      {l.retailer.name}
                      {!l.in_stock && <span className="chip">out of stock</span>}
                    </span>
                    <span className="flex items-center gap-2 font-mono font-medium">
                      {formatINR(l.price_inr)}
                      <ExternalLink className="size-3.5 text-muted" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {part.listings[0] && (
              <p className="mt-4 text-xs text-muted">
                Updated {timeAgo(part.listings[0].updated_at)}. Prices change often, so confirm at
                checkout.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
