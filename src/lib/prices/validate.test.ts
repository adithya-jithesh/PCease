import { describe, expect, it } from "vitest";
import { belongsTo, hostOf, judgeOffer, median, parseOffers } from "./validate";

const retailers = [
  { id: 1, slug: "amazon", homepage: "https://www.amazon.in" },
  { id: 3, slug: "mdcomputers", homepage: "https://mdcomputers.in" },
];

describe("parseOffers", () => {
  it("reads JSON wrapped in prose or code fences", () => {
    const text = 'Here you go:\n```json\n{"offers":[{"store":"Amazon","price_inr":"₹27,999","in_stock":true}]}\n```';
    expect(parseOffers(text)).toEqual([{ store: "amazon", price_inr: 27999, in_stock: true, url: undefined }]);
  });

  it("drops malformed entries and survives garbage", () => {
    expect(parseOffers('{"offers":[{"store":"amazon"},{"price_inr":5},{"store":"amazon","price_inr":100}]}')).toHaveLength(1);
    expect(parseOffers("no json here")).toEqual([]);
    expect(parseOffers("{broken")).toEqual([]);
  });
});

describe("domains", () => {
  it("matches a retailer's domain and subdomains only", () => {
    expect(hostOf("https://www.amazon.in/dp/X")).toBe("amazon.in");
    expect(belongsTo("amazon.in", "https://www.amazon.in")).toBe(true);
    expect(belongsTo("m.amazon.in", "https://www.amazon.in")).toBe(true);
    expect(belongsTo("notamazon.in", "https://www.amazon.in")).toBe(false);
    expect(belongsTo("amazon.in.evil.com", "https://www.amazon.in")).toBe(false);
  });
});

describe("judgeOffer", () => {
  const evidence = ["amazon.in", "mdcomputers.in"];

  it("accepts a plausible, evidenced price", () => {
    const v = judgeOffer({ store: "amazon", price_inr: 28500, url: "https://www.amazon.in/dp/B0X" }, retailers, evidence, 29000);
    expect(v).toMatchObject({ ok: true, price: 28500, url: "https://www.amazon.in/dp/B0X" });
  });

  it("rejects stores we don't list", () => {
    expect(judgeOffer({ store: "ebay", price_inr: 28000 }, retailers, evidence, 29000).ok).toBe(false);
  });

  it("rejects prices without search evidence from that store", () => {
    const v = judgeOffer({ store: "mdcomputers", price_inr: 28000 }, retailers, ["amazon.in"], 29000);
    expect(v).toMatchObject({ ok: false });
  });

  it("rejects links to other sites", () => {
    const v = judgeOffer({ store: "amazon", price_inr: 28000, url: "https://pricehistory.example/amazon" }, retailers, evidence, 29000);
    expect(v.ok).toBe(false);
  });

  it("rejects prices far from the current median", () => {
    expect(judgeOffer({ store: "amazon", price_inr: 9000 }, retailers, evidence, 29000).ok).toBe(false);
    expect(judgeOffer({ store: "amazon", price_inr: 60000 }, retailers, evidence, 29000).ok).toBe(false);
    expect(judgeOffer({ store: "amazon", price_inr: 20000 }, retailers, evidence, 29000).ok).toBe(true);
  });
});

describe("median", () => {
  it("handles odd, even and empty inputs", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(3);
    expect(median([])).toBeNull();
  });
});
