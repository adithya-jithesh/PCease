import { describe, expect, it } from "vitest";
import { loadSeedCatalogue } from "../__fixtures__/catalogue";
import { runTool, TOOL_DECLARATIONS } from "./tools";

const parts = loadSeedCatalogue();
const ctx = {
  parts,
  loadListings: async () => [{ retailer: "Amazon.in", price_inr: 1000, in_stock: true }],
};
type Row = { slug: string; category: string; price_inr: number };

describe("advisor tools", () => {
  it("declares a tool for every runTool branch", () => {
    expect(TOOL_DECLARATIONS.map((t) => t.name).sort()).toEqual(
      ["check_compatibility", "get_part_details", "plan_build", "search_parts"].sort(),
    );
  });

  it("search_parts filters by category, price and text", async () => {
    const { response } = await runTool("search_parts", { category: "gpu", max_price: 30000, query: "nvidia" }, ctx);
    const results = response.results as Row[];
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.category).toBe("gpu");
      expect(r.price_inr).toBeLessThanOrEqual(30000);
    }
    expect(results.map((r) => r.slug)).toContain("rtx-4060");
  });

  it("search_parts only returns parts compatible with the given ones", async () => {
    const { response } = await runTool(
      "search_parts",
      { category: "motherboard", compatible_with: ["ryzen-5-7600"], limit: 15 },
      ctx,
    );
    const slugs = (response.results as Row[]).map((r) => r.slug);
    expect(slugs.length).toBeGreaterThan(0);
    // Only AM5 boards fit a Ryzen 5 7600.
    for (const slug of slugs) {
      expect(parts.find((p) => p.slug === slug)!.specs.socket).toBe("AM5");
    }
  });

  it("check_compatibility reports errors and only offers error-free complete builds", async () => {
    const bad = await runTool("check_compatibility", { slugs: ["ryzen-5-7600", "msi-b550m-pro-vdh-wifi"] }, ctx);
    const checks = bad.response.checks as { level: string; title: string }[];
    expect(checks.some((c) => c.level === "error" && c.title === "Socket mismatch")).toBe(true);
    expect(bad.build).toBeUndefined();

    const good = await runTool(
      "check_compatibility",
      {
        slugs: [
          "ryzen-5-7600",
          "rtx-4060",
          "msi-pro-b650m-p",
          "kingston-fury-16-5200",
          "crucial-p3-plus-1tb",
          "cm-mwe-650-bronze-v2",
          "deepcool-cc560-v2",
          "deepcool-ak400",
        ],
      },
      ctx,
    );
    expect(good.build).toBeDefined();
    expect(Object.keys(good.build!)).toHaveLength(8);
  });

  it("check_compatibility flags slugs it doesn't know", async () => {
    const { response } = await runTool("check_compatibility", { slugs: ["rtx-9090-imaginary"] }, ctx);
    expect(response.unknown_slugs).toEqual(["rtx-9090-imaginary"]);
  });

  it("plan_build returns a build and handles impossible budgets", async () => {
    const ok = await runTool("plan_build", { budget: 80000, use_case: "gaming" }, ctx);
    expect(ok.build).toBeDefined();
    expect(ok.response.total_inr).toBeLessThanOrEqual(80000);

    const tooSmall = await runTool("plan_build", { budget: 5000, use_case: "gaming" }, ctx);
    expect(tooSmall.response.error).toMatch(/No complete build/);
    expect(tooSmall.build).toBeUndefined();
  });

  it("get_part_details includes retailer prices, and errors on unknown slugs", async () => {
    const found = await runTool("get_part_details", { slug: "rtx-4060" }, ctx);
    expect(found.response.retailers).toHaveLength(1);
    const missing = await runTool("get_part_details", { slug: "nope" }, ctx);
    expect(missing.response.error).toBeDefined();
  });
});
