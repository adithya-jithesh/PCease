import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Category, Part } from "../types";

/**
 * Loads the parts from supabase/seed.sql so tests run against the same
 * catalogue the app ships with. Each part's reference price becomes best_price.
 */
export function loadSeedCatalogue(): Part[] {
  const sql = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
  const row =
    /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'(\{.*?\})',\s*(\w+),\s*(\w+),\s*(\d+)\)/g;

  const parts: Part[] = [];
  for (const m of sql.matchAll(row)) {
    const [, slug, category, brand, name, specs, watts, tier, price] = m;
    parts.push({
      id: parts.length + 1,
      slug,
      category: category as Category,
      brand,
      name,
      specs: JSON.parse(specs),
      watts: watts === "null" ? null : Number(watts),
      tier: tier === "null" ? null : Number(tier),
      image_url: null,
      best_price: Number(price),
      offer_count: 3,
    });
  }
  return parts;
}

export function bySlug(parts: Part[], slug: string): Part {
  const part = parts.find((p) => p.slug === slug);
  if (!part) throw new Error(`No seed part ${slug}`);
  return part;
}
