import { describe, expect, it } from "vitest";
import { bySlug, loadSeedCatalogue } from "./__fixtures__/catalogue";
import { analyzeBuild, recommendPsu } from "./compat";

const parts = loadSeedCatalogue();
const p = (slug: string) => bySlug(parts, slug);
const titles = (build: Parameters<typeof analyzeBuild>[0], level: "ok" | "warn" | "error") =>
  analyzeBuild(build)
    .checks.filter((c) => c.level === level)
    .map((c) => c.title);

describe("analyzeBuild", () => {
  const goodAm5 = {
    cpu: p("ryzen-5-7600"),
    gpu: p("rtx-4060"),
    motherboard: p("msi-pro-b650m-p"),
    ram: p("kingston-fury-16-5200"),
    storage: p("crucial-p3-plus-1tb"),
    psu: p("cm-mwe-650-bronze-v2"),
    case: p("deepcool-cc560-v2"),
    cooler: p("deepcool-ak400"),
  };

  it("passes a known-good build with no errors", () => {
    expect(titles(goodAm5, "error")).toEqual([]);
    expect(analyzeBuild(goodAm5).missing).toEqual([]);
  });

  it("catches a socket mismatch", () => {
    expect(titles({ ...goodAm5, motherboard: p("msi-b550m-pro-vdh-wifi") }, "error")).toContain("Socket mismatch");
  });

  it("catches DDR4 memory on a DDR5 board", () => {
    expect(titles({ ...goodAm5, ram: p("corsair-lpx-16-3200") }, "error")).toContain("Wrong memory type");
  });

  it("catches an ATX board in an mATX-only case", () => {
    const build = { ...goodAm5, motherboard: p("gigabyte-b650-aorus-elite-ax"), case: p("cm-q300l") };
    expect(titles(build, "error")).toContain("Board doesn't fit the case");
  });

  it("flags an underpowered PSU", () => {
    const build = { ...goodAm5, gpu: p("rtx-4080-super"), cpu: p("ryzen-9-9900x"), psu: p("deepcool-pk550d") };
    expect(titles(build, "error")).toContain("Power supply too weak");
  });

  it("requires a GPU when the CPU has no integrated graphics", () => {
    const build = { ...goodAm5, cpu: p("core-i5-12400f"), motherboard: p("gigabyte-b760m-ds3h-ax"), gpu: undefined };
    expect(titles(build, "error")).toContain("No display output");
  });

  it("allows no GPU when the CPU has integrated graphics", () => {
    expect(titles({ ...goodAm5, gpu: undefined }, "error")).toEqual([]);
  });

  it("warns about a lopsided CPU/GPU pairing", () => {
    const build = { ...goodAm5, cpu: p("core-i3-12100f"), motherboard: p("gigabyte-b760m-ds3h-ax"), gpu: p("rtx-4080-super"), psu: p("corsair-rm1000x") };
    expect(titles(build, "warn")).toContain("CPU may hold the GPU back");
  });

  it("sorts errors before warnings before passes", () => {
    const levels = analyzeBuild({ ...goodAm5, ram: p("corsair-lpx-16-3200"), cooler: undefined }).checks.map((c) => c.level);
    expect(levels).toEqual([...levels].sort((a, b) => ["error", "warn", "ok"].indexOf(a) - ["error", "warn", "ok"].indexOf(b)));
  });
});

describe("recommendPsu", () => {
  it("rounds up to a standard size with headroom", () => {
    expect(recommendPsu(300)).toBe(450);
    expect(recommendPsu(500)).toBe(650);
    expect(recommendPsu(700)).toBe(1000);
  });
});

describe("board tier", () => {
  it("warns when a high-end CPU sits on an entry-level board", () => {
    const build = { cpu: p("core-i7-14700kf"), motherboard: p("msi-pro-h610m-e-ddr4") };
    expect(titles(build, "warn")).toContain("Entry-level board for a high-end CPU");
  });
});
