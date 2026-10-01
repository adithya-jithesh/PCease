"use client";

import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { useBuild } from "@/lib/stores";
import type { BuildSelection } from "@/lib/types";

export function OpenInBuilder({ selection, label = "Open in builder" }: { selection: BuildSelection; label?: string }) {
  const { replace } = useBuild();
  const router = useRouter();
  return (
    <button
      onClick={() => {
        replace(selection);
        router.push("/builder");
      }}
      className="btn-primary"
    >
      <Wrench className="size-4" /> {label}
    </button>
  );
}
