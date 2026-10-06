/**
 * Pure checks applied to prices the AI lookup reports, before anything is
 * written. A price is only accepted when it is plausible and traceable to the
 * retailer's own site.
 */

export interface RawOffer {
  store: string;
  price_inr: number;
  in_stock?: boolean;
  url?: string;
}

export interface RetailerRef {
  id: number;
  slug: string;
  homepage: string;
}

/** Accept prices within this band around the part's current median price. */
export const MIN_RATIO = 0.6;
export const MAX_RATIO = 1.5;

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** True if `host` is the retailer's domain or one of its subdomains. */
export function belongsTo(host: string | null, homepage: string): boolean {
  const domain = hostOf(homepage);
  if (!host || !domain) return false;
  return host === domain || host.endsWith(`.${domain}`);
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Pull the offers array out of a model reply that may wrap JSON in prose or code fences. */
export function parseOffers(text: string): RawOffer[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    const data = JSON.parse(text.slice(start, end + 1)) as { offers?: unknown };
    if (!Array.isArray(data.offers)) return [];
    return data.offers.flatMap((o) => {
      if (!o || typeof o !== "object") return [];
      const r = o as Record<string, unknown>;
      const price = typeof r.price_inr === "string" ? Number(r.price_inr.replace(/[^\d.]/g, "")) : Number(r.price_inr);
      if (typeof r.store !== "string" || !Number.isFinite(price)) return [];
      return [
        {
          store: r.store.trim().toLowerCase(),
          price_inr: Math.round(price),
          in_stock: typeof r.in_stock === "boolean" ? r.in_stock : undefined,
          url: typeof r.url === "string" ? r.url : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

export type Verdict =
  | { ok: true; retailer: RetailerRef; price: number; inStock: boolean; url: string | null }
  | { ok: false; reason: string };

/**
 * Decide whether to trust one reported offer.
 * - the store must be one of ours,
 * - Google Search must have surfaced that store's domain (evidenceHosts),
 * - any URL given must be on the store's domain,
 * - the price must be within MIN_RATIO..MAX_RATIO of the current median.
 */
export function judgeOffer(
  offer: RawOffer,
  retailers: RetailerRef[],
  evidenceHosts: string[],
  referencePrice: number | null,
): Verdict {
  const retailer = retailers.find((r) => r.slug === offer.store);
  if (!retailer) return { ok: false, reason: `unknown store "${offer.store}"` };

  if (!evidenceHosts.some((h) => belongsTo(h, retailer.homepage))) {
    return { ok: false, reason: `no search evidence from ${hostOf(retailer.homepage)}` };
  }

  if (offer.url && !belongsTo(hostOf(offer.url), retailer.homepage)) {
    return { ok: false, reason: `link is not on ${hostOf(retailer.homepage)}` };
  }

  const price = offer.price_inr;
  if (!Number.isInteger(price) || price < 100 || price > 1_000_000) {
    return { ok: false, reason: `implausible price ₹${price}` };
  }
  if (referencePrice && (price < referencePrice * MIN_RATIO || price > referencePrice * MAX_RATIO)) {
    return { ok: false, reason: `₹${price} is too far from the current ₹${referencePrice}` };
  }

  return { ok: true, retailer, price, inStock: offer.in_stock ?? true, url: offer.url ?? null };
}
