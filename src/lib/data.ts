import "server-only";
import { createClient } from "./supabase/server";
import type { BuildSelection, Category, Part, PartWithListings, ResolvedBuild } from "./types";
import { CATEGORIES } from "./types";

export type SortKey = "popular" | "price-asc" | "price-desc" | "name";

export interface PartQuery {
  category?: Category;
  q?: string;
  brand?: string;
  maxPrice?: number;
  sort?: SortKey;
}

// PostgREST filter strings treat these characters as syntax.
const sanitize = (s: string) => s.replace(/[%,()*\\]/g, " ").trim();

export async function listParts(query: PartQuery = {}): Promise<Part[]> {
  const supabase = await createClient();
  let req = supabase.from("part_summaries").select("*");

  if (query.category) req = req.eq("category", query.category);
  if (query.brand) req = req.eq("brand", query.brand);
  if (query.maxPrice) req = req.lte("best_price", query.maxPrice);
  if (query.q) {
    const term = sanitize(query.q);
    if (term) req = req.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
  }

  switch (query.sort) {
    case "price-asc":
      req = req.order("best_price", { ascending: true, nullsFirst: false });
      break;
    case "price-desc":
      req = req.order("best_price", { ascending: false, nullsFirst: false });
      break;
    case "name":
      req = req.order("brand").order("name");
      break;
    default:
      req = req.order("offer_count", { ascending: false }).order("best_price");
  }

  const { data, error } = await req.limit(200);
  if (error) throw error;
  return (data ?? []) as Part[];
}

export async function listBrands(category?: Category): Promise<string[]> {
  const supabase = await createClient();
  let req = supabase.from("parts").select("brand");
  if (category) req = req.eq("category", category);
  const { data } = await req;
  return [...new Set((data ?? []).map((r) => r.brand as string))].sort();
}

export async function getPart(slug: string): Promise<PartWithListings | null> {
  const supabase = await createClient();
  const { data: part } = await supabase
    .from("part_summaries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!part) return null;

  const { data: listings } = await supabase
    .from("listings")
    .select("price_inr, url, in_stock, updated_at, retailer:retailers(*)")
    .eq("part_id", part.id)
    .order("price_inr");

  return { ...(part as Part), listings: (listings ?? []) as unknown as PartWithListings["listings"] };
}

export async function getPartsByIds(ids: number[]): Promise<Part[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("part_summaries").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Part[];
}

export async function resolveBuild(selection: BuildSelection): Promise<ResolvedBuild> {
  const parts = await getPartsByIds(Object.values(selection).filter(Boolean) as number[]);
  const byId = new Map(parts.map((p) => [p.id, p]));
  const resolved: ResolvedBuild = {};
  for (const slot of CATEGORIES) {
    const id = selection[slot];
    const part = id ? byId.get(id) : undefined;
    if (part && part.category === slot) resolved[slot] = part;
  }
  return resolved;
}

export async function getCatalogueStats() {
  const supabase = await createClient();
  const [parts, retailers] = await Promise.all([
    supabase.from("parts").select("*", { count: "exact", head: true }),
    supabase.from("retailers").select("*", { count: "exact", head: true }),
  ]);
  return { parts: parts.count ?? 0, retailers: retailers.count ?? 0 };
}
