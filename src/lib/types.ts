export const CATEGORIES = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "case",
  "cooler",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Specs = Record<string, string | number | boolean | string[] | null>;

export interface Part {
  id: number;
  slug: string;
  category: Category;
  brand: string;
  name: string;
  specs: Specs;
  watts: number | null;
  tier: number | null;
  image_url: string | null;
  best_price: number | null;
  offer_count: number;
}

export interface Retailer {
  id: number;
  slug: string;
  name: string;
  homepage: string;
  search_url: string;
}

export interface Listing {
  retailer: Retailer;
  price_inr: number;
  url: string | null;
  in_stock: boolean;
  updated_at: string;
}

export interface PartWithListings extends Part {
  listings: Listing[];
}

/** A build as stored: slot -> part id. */
export type BuildSelection = Partial<Record<Category, number>>;

/** A build with its parts resolved. */
export type ResolvedBuild = Partial<Record<Category, Part>>;

export interface SavedBuild {
  id: string;
  owner_id: string;
  title: string;
  notes: string | null;
  parts: BuildSelection;
  total_inr: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const FORUM_TOPICS = [
  "build-help",
  "troubleshooting",
  "deals",
  "showcase",
  "general",
] as const;

export type ForumTopic = (typeof FORUM_TOPICS)[number];

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Thread {
  id: number;
  topic: ForumTopic;
  title: string;
  body: string;
  score: number;
  reply_count: number;
  created_at: string;
  last_activity_at: string;
  build_id: string | null;
  author: Pick<Profile, "username" | "avatar_url"> | null;
  author_id: string | null;
}

export interface Reply {
  id: number;
  body: string;
  created_at: string;
  author_id: string | null;
  author: Pick<Profile, "username" | "avatar_url"> | null;
}
