"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useCompare } from "@/lib/stores";

/**
 * The URL is the source of truth on this page (so comparisons can be shared);
 * mirror it into the local compare tray.
 */
export function CompareSync({ ids }: { ids: number[] }) {
  const { ids: stored, replace } = useCompare();
  const router = useRouter();
  const key = ids.join(",");

  useEffect(() => {
    if (!ids.length && stored.length) {
      router.replace(`/compare?ids=${stored.join(",")}`);
    } else if (ids.length && key !== stored.join(",")) {
      replace(ids);
    }
    // Only react to URL changes, not to the tray updating itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}

export function RemoveButton({ id, remaining }: { id: number; remaining: number[] }) {
  const { remove } = useCompare();
  const router = useRouter();
  return (
    <button
      onClick={() => {
        remove(id);
        router.replace(remaining.length ? `/compare?ids=${remaining.join(",")}` : "/compare");
      }}
      className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-err"
    >
      <X className="size-3" /> Remove
    </button>
  );
}
