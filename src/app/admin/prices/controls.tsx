"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { submitWithoutReset } from "@/lib/forms";
import { refreshPart, refreshStalest, updateListing, type ActionResult } from "./actions";

function Result({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return <span className={`text-xs ${result.ok ? "text-ok" : "text-err"}`}>{result.message}</span>;
}

export function RefreshStalestButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        onClick={() => start(async () => setResult(await refreshStalest()))}
        className="btn-primary"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        {pending ? "Refreshing… (about a minute)" : "Refresh 5 stalest parts"}
      </button>
      <Result result={result} />
    </div>
  );
}

export function RefreshPartButton({ slug }: { slug: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <span className="flex items-center gap-2">
      <Result result={result} />
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await refreshPart(slug)))}
        className="btn-outline px-3 py-1 text-xs"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        Refresh with AI
      </button>
    </span>
  );
}

export function ListingEditor({
  partId,
  retailerId,
  price,
  inStock,
}: {
  partId: number;
  retailerId: number;
  price: number;
  inStock: boolean;
}) {
  const [result, action, pending] = useActionState(updateListing, null);
  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="part_id" value={partId} />
      <input type="hidden" name="retailer_id" value={retailerId} />
      <label className="relative">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted">₹</span>
        <input
          name="price_inr"
          type="number"
          min={1}
          step={1}
          defaultValue={price}
          aria-label="Price in rupees"
          className="input w-28 py-1 pl-6 font-mono"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <input type="checkbox" name="in_stock" defaultChecked={inStock} className="size-3.5 accent-[var(--accent)]" />
        In stock
      </label>
      <button disabled={pending} className="btn-ghost px-2.5 py-1 text-xs">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save
      </button>
      <Result result={result} />
    </form>
  );
}
