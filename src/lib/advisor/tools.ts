import type { FunctionDeclaration } from "@google/genai";
import { CATEGORY_META, headlineSpecs } from "../catalog";
import { analyzeBuild } from "../compat";
import { planBuild, USE_CASES, type UseCase } from "../planner";
import { CATEGORIES, type Category, type Part, type ResolvedBuild } from "../types";

/**
 * Tools the advisor model can call. Every recommendation it makes has to come
 * from these, so it can only suggest parts we actually list, at real prices.
 */
export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_parts",
    description:
      "Search the PCease catalogue. Returns matching parts with slug, price in INR and key specs, cheapest first. " +
      "Pass compatible_with (slugs) to only return parts that fit alongside those parts.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...CATEGORIES], description: "Part category" },
        query: { type: "string", description: "Free text such as a brand or model, e.g. 'ryzen 7' or 'nvidia'" },
        min_price: { type: "number", description: "Minimum price in INR" },
        max_price: { type: "number", description: "Maximum price in INR" },
        compatible_with: {
          type: "array",
          items: { type: "string" },
          description: "Slugs of parts already chosen; results must be compatible with them",
        },
        limit: { type: "integer", description: "Max results (default 8, max 15)" },
      },
    },
  },
  {
    name: "get_part_details",
    description: "Full specifications and per-retailer prices for one part.",
    parametersJsonSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "check_compatibility",
    description:
      "Run the PCease compatibility checks (socket, memory type, form factor, GPU/cooler clearance, PSU headroom, " +
      "CPU/GPU balance) on a set of parts. Always call this before recommending a combination of parts.",
    parametersJsonSchema: {
      type: "object",
      properties: { slugs: { type: "array", items: { type: "string" }, description: "One part per category" } },
      required: ["slugs"],
    },
  },
  {
    name: "plan_build",
    description:
      "Plan a complete, compatible build within a budget using the PCease planner. Use for 'build me a PC for X'.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        budget: { type: "number", description: "Total budget in INR" },
        use_case: { type: "string", enum: Object.keys(USE_CASES) },
      },
      required: ["budget", "use_case"],
    },
  },
];

const summary = (p: Part) => ({
  slug: p.slug,
  name: `${p.brand} ${p.name}`,
  category: p.category,
  price_inr: p.best_price,
  specs: headlineSpecs(p).join(", "),
  watts: p.watts,
  performance_tier: p.tier,
});

function resolveSlugs(parts: Part[], slugs: unknown): { build: ResolvedBuild; unknown: string[] } {
  const bySlug = new Map(parts.map((p) => [p.slug, p]));
  const build: ResolvedBuild = {};
  const unknown: string[] = [];
  for (const slug of Array.isArray(slugs) ? slugs : []) {
    const part = bySlug.get(String(slug));
    if (part) build[part.category] = part;
    else unknown.push(String(slug));
  }
  return { build, unknown };
}

function buildSummary(build: ResolvedBuild) {
  const analysis = analyzeBuild(build);
  return {
    parts: CATEGORIES.filter((c) => build[c]).map((c) => summary(build[c]!)),
    total_inr: analysis.total,
    estimated_watts: analysis.estimatedWatts,
    recommended_psu_watts: analysis.recommendedPsu,
    missing_required: analysis.missing,
    checks: analysis.checks.map((c) => ({ level: c.level, title: c.title, detail: c.detail })),
  };
}

export interface ToolContext {
  parts: Part[];
  /** Retailer prices for a part, loaded lazily. */
  loadListings: (slug: string) => Promise<{ retailer: string; price_inr: number; in_stock: boolean }[]>;
}

export interface ToolResult {
  /** Returned to the model. */
  response: Record<string, unknown>;
  /** A complete build worth offering to load into the builder. */
  build?: Partial<Record<Category, number>>;
}

export const TOOL_STATUS: Record<string, (args: Record<string, unknown>) => string> = {
  search_parts: (a) =>
    `Searching ${a.category ? CATEGORY_META[a.category as Category]?.plural.toLowerCase() ?? "parts" : "parts"}…`,
  get_part_details: () => "Looking up prices…",
  check_compatibility: () => "Checking compatibility…",
  plan_build: (a) => `Planning a ₹${Number(a.budget).toLocaleString("en-IN")} build…`,
};

export async function runTool(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const { parts } = ctx;

  switch (name) {
    case "search_parts": {
      const category = CATEGORIES.includes(args.category as Category) ? (args.category as Category) : undefined;
      const terms = String(args.query ?? "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const min = Number(args.min_price) || 0;
      const max = Number(args.max_price) || Infinity;
      const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 15);
      const { build: context } = resolveSlugs(parts, args.compatible_with);
      const baseErrors = new Set(
        analyzeBuild(context)
          .checks.filter((c) => c.level === "error")
          .map((c) => c.title),
      );

      const results = parts
        .filter((p) => !category || p.category === category)
        .filter((p) => p.best_price != null && p.best_price >= min && p.best_price <= max)
        .filter((p) => terms.every((t) => `${p.brand} ${p.name} ${p.slug}`.toLowerCase().includes(t)))
        .filter((p) => {
          if (!Object.keys(context).length) return true;
          const trial = { ...context, [p.category]: p };
          return !analyzeBuild(trial).checks.some((c) => c.level === "error" && !baseErrors.has(c.title));
        })
        .sort((a, b) => (a.best_price ?? 0) - (b.best_price ?? 0))
        .slice(0, limit)
        .map(summary);

      return { response: { count: results.length, results } };
    }

    case "get_part_details": {
      const part = parts.find((p) => p.slug === String(args.slug));
      if (!part) return { response: { error: `No part with slug "${args.slug}". Use search_parts to find slugs.` } };
      return {
        response: {
          ...summary(part),
          all_specs: part.specs,
          retailers: await ctx.loadListings(part.slug),
        },
      };
    }

    case "check_compatibility": {
      const { build, unknown } = resolveSlugs(parts, args.slugs);
      const result = buildSummary(build);
      const complete = result.missing_required.length === 0;
      const hasErrors = result.checks.some((c) => c.level === "error");
      return {
        response: { ...result, unknown_slugs: unknown },
        build: complete && !hasErrors ? selectionOf(build) : undefined,
      };
    }

    case "plan_build": {
      const budget = Number(args.budget);
      const useCase = (Object.keys(USE_CASES) as UseCase[]).includes(args.use_case as UseCase)
        ? (args.use_case as UseCase)
        : "gaming";
      if (!Number.isFinite(budget) || budget <= 0) return { response: { error: "Budget must be a positive number." } };
      const plan = planBuild(parts, budget, useCase);
      if (!plan) {
        return {
          response: { error: `No complete build fits ₹${budget} for ${useCase}. Suggest a higher budget.` },
        };
      }
      return {
        response: { ...buildSummary(plan.build), leftover_inr: plan.leftover, notes: plan.notes },
        build: selectionOf(plan.build),
      };
    }

    default:
      return { response: { error: `Unknown tool ${name}` } };
  }
}

function selectionOf(build: ResolvedBuild): Partial<Record<Category, number>> {
  return Object.fromEntries(Object.entries(build).map(([slot, p]) => [slot, p!.id]));
}
