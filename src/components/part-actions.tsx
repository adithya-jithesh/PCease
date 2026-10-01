"use client";

import { useRouter } from "next/navigation";
import { Check, GitCompareArrows, Plus } from "lucide-react";
import { useBuild, useCompare } from "@/lib/stores";
import type { Category } from "@/lib/types";

export function AddToBuildButton({
  id,
  category,
  compact = false,
  goToBuilder = false,
}: {
  id: number;
  category: Category;
  compact?: boolean;
  goToBuilder?: boolean;
}) {
  const { build, setPart } = useBuild();
  const router = useRouter();
  const selected = build[category] === id;

  return (
    <button
      type="button"
      onClick={() => {
        setPart(category, selected ? null : id);
        if (!selected && goToBuilder) router.push("/builder");
      }}
      className={selected ? "btn bg-ok-soft text-ok" : compact ? "btn-outline" : "btn-primary"}
      aria-pressed={selected}
    >
      {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
      {selected ? "In build" : "Add to build"}
    </button>
  );
}

export function CompareToggle({ id }: { id: number }) {
  const { ids, toggle, full } = useCompare();
  const active = ids.includes(id);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      disabled={!active && full}
      title={!active && full ? "You can compare up to 4 parts" : undefined}
      aria-pressed={active}
      className={active ? "btn bg-accent-soft text-accent" : "btn-ghost text-muted"}
    >
      <GitCompareArrows className="size-4" />
      {active ? "Comparing" : "Compare"}
    </button>
  );
}
