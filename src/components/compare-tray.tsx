"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { MAX_COMPARE, useCompare } from "@/lib/stores";

export function CompareTray() {
  const { ids, clear } = useCompare();
  const pathname = usePathname();
  if (!ids.length || pathname === "/compare") return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-line bg-surface-2 py-2 pr-2 pl-5 text-sm text-ink shadow-xl shadow-black/40">
        <GitCompareArrows className="size-4" />
        <span>
          {ids.length} of {MAX_COMPARE} selected
        </span>
        <Link href={`/compare?ids=${ids.join(",")}`} className="btn bg-accent py-1.5 text-accent-ink">
          Compare
        </Link>
        <button onClick={clear} aria-label="Clear comparison" className="rounded-full p-1.5 opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
