import type { Category } from "../types";

interface SlugTarget {
  slug: string;
  category: Category;
}

/**
 * Find the catalogue item for a slug the model wrote. Exact match first, then
 * lenient matches for near-misses like "amd-ryzen-7-7800x3d" vs "ryzen-7-7800x3d".
 */
export function resolveSlug<T extends SlugTarget>(slug: string, bySlug: Map<string, T>): T | undefined {
  const exact = bySlug.get(slug);
  if (exact) return exact;
  // Only the safe direction: the model added a prefix (usually the brand).
  // A shorter slug like "4060" could mean several parts, so it's not guessed.
  const candidates = [...bySlug.values()].filter((item) => slug.endsWith(`-${item.slug}`));
  // Only accept an unambiguous near-miss.
  return candidates.length === 1 ? candidates[0] : undefined;
}

/** "amd-ryzen-7-7800x3d" -> "Amd Ryzen 7 7800x3d", for slugs we couldn't resolve. */
export function humanize(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
