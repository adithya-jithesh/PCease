export interface PriceEvent {
  retailer_id: number;
  price_inr: number;
  in_stock: boolean;
  recorded_at: string;
}

export interface DailyPrice {
  day: string; // YYYY-MM-DD
  best: number;
}

/**
 * Turn per-retailer price changes into the best in-stock price for each day,
 * carrying each retailer's last known price forward. Events must be sorted
 * oldest first.
 */
export function bestPriceByDay(events: PriceEvent[], until = new Date()): DailyPrice[] {
  if (!events.length) return [];
  const latest = new Map<number, { price: number; inStock: boolean }>();
  const series: DailyPrice[] = [];
  const dayOf = (iso: string) => iso.slice(0, 10);

  let i = 0;
  const cursor = new Date(`${dayOf(events[0].recorded_at)}T00:00:00Z`);
  const end = dayOf(until.toISOString());

  for (let day = dayOf(cursor.toISOString()); day <= end; ) {
    while (i < events.length && dayOf(events[i].recorded_at) <= day) {
      const e = events[i++];
      latest.set(e.retailer_id, { price: e.price_inr, inStock: e.in_stock });
    }
    const prices = [...latest.values()].filter((v) => v.inStock).map((v) => v.price);
    if (prices.length) series.push({ day, best: Math.min(...prices) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    day = dayOf(cursor.toISOString());
  }
  return series;
}
