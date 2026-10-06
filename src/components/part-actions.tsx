"use client";

import { useRouter } from "next/navigation";
import { Check, GitCompareArrows, Plus } from "lucide-react";
import { slotNoun } from "@/lib/catalog";
import { MAX_COMPARE, useBuild, useCompare } from "@/lib/stores";
import { toast } from "@/lib/toast";
import type { Category } from "@/lib/types";

export function AddToBuildButton({
  id,
  category,
  name,
  compact = false,
  goToBuilder = false,
}: {
  id: number;
  category: Category;
  /** Shown in the confirmation toast. */
  name: string;
  compact?: boolean;
  goToBuilder?: boolean;
}) {
  const { build, setPart } = useBuild();
  const router = useRouter();
  const selected = build[category] === id;
  const replacing = !selected && build[category] != null;

  return (
    <button
      type="button"
      onClick={() => {
        if (selected) {
          setPart(category, null);
          toast(`Removed ${name} from your build.`);
          return;
        }
        setPart(category, id);
        if (goToBuilder) {
          router.push("/builder");
        } else {
          toast(replacing ? `Swapped in ${name} as your ${slotNoun(category)}.` : `Added ${name} to your build.`, {
            tone: "success",
            action: { label: "View build", href: "/builder" },
          });
        }
      }}
      className={selected ? "btn bg-ok-soft text-ok" : compact ? "btn-outline" : "btn-primary"}
      aria-pressed={selected}
      title={replacing ? `Replaces the ${slotNoun(category)} already in your build` : undefined}
    >
      {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
      {selected ? "In build" : replacing ? "Swap in" : "Add to build"}
    </button>
  );
}

export function CompareToggle({ id, name }: { id: number; name: string }) {
  const { ids, toggle, full } = useCompare();
  const active = ids.includes(id);

  return (
    <button
      type="button"
      onClick={() => {
        toggle(id);
        if (!active) {
          toast(`${name} added to compare (${ids.length + 1}/${MAX_COMPARE}).`, {
            action: ids.length >= 1 ? { label: "Compare now", href: `/compare?ids=${[...ids, id].join(",")}` } : undefined,
          });
        }
      }}
      disabled={!active && full}
      title={!active && full ? `You can compare up to ${MAX_COMPARE} parts` : undefined}
      aria-pressed={active}
      className={active ? "btn bg-accent-soft text-accent" : "btn-ghost text-muted"}
    >
      <GitCompareArrows className="size-4" />
      {active ? "Comparing" : "Compare"}
    </button>
  );
}
