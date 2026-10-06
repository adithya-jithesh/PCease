import { describe, expect, it } from "vitest";
import { humanize, resolveSlug } from "./slugs";

const items = ["ryzen-7-7800x3d", "rtx-4060", "rtx-4060-ti", "msi-pro-b650m-p"].map((slug) => ({
  slug,
  category: "gpu" as const,
}));
const bySlug = new Map(items.map((i) => [i.slug, i]));

describe("resolveSlug", () => {
  it("prefers exact matches", () => {
    expect(resolveSlug("rtx-4060", bySlug)?.slug).toBe("rtx-4060");
  });

  it("accepts an unambiguous brand-prefixed near miss", () => {
    expect(resolveSlug("amd-ryzen-7-7800x3d", bySlug)?.slug).toBe("ryzen-7-7800x3d");
  });

  it("refuses ambiguous or unrelated slugs", () => {
    expect(resolveSlug("nvidia-rtx-4090", bySlug)).toBeUndefined();
    expect(resolveSlug("4060", bySlug)).toBeUndefined();
  });
});

describe("humanize", () => {
  it("turns a slug into readable text", () => {
    expect(humanize("amd-ryzen-7-7800x3d")).toBe("Amd Ryzen 7 7800x3d");
  });
});
