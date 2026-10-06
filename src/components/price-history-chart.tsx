import { TrendingDown, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { DailyPrice } from "@/lib/price-history";

const W = 320;
const H = 72;

/** Best-price sparkline with the period low. Hidden until there's real history. */
export function PriceHistoryChart({ series }: { series: DailyPrice[] }) {
  const distinct = new Set(series.map((s) => s.best));
  if (series.length < 2 || distinct.size < 2) {
    return (
      <p className="text-xs text-muted">
        Price history builds up as prices change. Check back in a few days.
      </p>
    );
  }

  const values = series.map((s) => s.best);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (series.length - 1)) * W;
  const y = (v: number) => H - 6 - ((v - min) / span) * (H - 12);
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(s.best).toFixed(1)}`).join(" ");
  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">{series.length}-day best price</span>
        <span className={`flex items-center gap-1 font-mono ${change < 0 ? "text-ok" : change > 0 ? "text-err" : "text-muted"}`}>
          {change < 0 ? <TrendingDown className="size-3.5" /> : change > 0 ? <TrendingUp className="size-3.5" /> : null}
          {change === 0 ? "no change" : `${change < 0 ? "−" : "+"}${formatINR(Math.abs(change))}`}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-18 w-full" preserveAspectRatio="none" role="img" aria-label="Best price over time">
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="var(--accent)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-1 text-xs text-muted">
        Lowest in this period: <span className="font-mono text-ink">{formatINR(min)}</span>
      </p>
    </div>
  );
}
