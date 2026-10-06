import { describe, expect, it } from "vitest";
import { bestPriceByDay } from "./price-history";

const e = (retailer_id: number, price_inr: number, day: string, in_stock = true) => ({
  retailer_id,
  price_inr,
  in_stock,
  recorded_at: `${day}T10:00:00Z`,
});

describe("bestPriceByDay", () => {
  it("carries prices forward and takes the daily minimum", () => {
    const series = bestPriceByDay(
      [e(1, 1000, "2026-10-01"), e(2, 1100, "2026-10-01"), e(2, 950, "2026-10-03")],
      new Date("2026-10-04T12:00:00Z"),
    );
    expect(series).toEqual([
      { day: "2026-10-01", best: 1000 },
      { day: "2026-10-02", best: 1000 },
      { day: "2026-10-03", best: 950 },
      { day: "2026-10-04", best: 950 },
    ]);
  });

  it("ignores out-of-stock prices", () => {
    const series = bestPriceByDay(
      [e(1, 900, "2026-10-01", false), e(2, 1200, "2026-10-01")],
      new Date("2026-10-01T12:00:00Z"),
    );
    expect(series).toEqual([{ day: "2026-10-01", best: 1200 }]);
  });

  it("returns nothing without events", () => {
    expect(bestPriceByDay([])).toEqual([]);
  });
});
