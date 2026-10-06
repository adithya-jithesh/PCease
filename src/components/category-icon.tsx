import { Box, CircuitBoard, Cpu, Fan, Gpu, HardDrive, MemoryStick, PlugZap, type LucideProps } from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS: Record<Category, React.ComponentType<LucideProps>> = {
  cpu: Cpu,
  gpu: Gpu,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  psu: PlugZap,
  case: Box,
  cooler: Fan,
};

export function CategoryIcon({ category, ...props }: { category: Category } & LucideProps) {
  const Icon = ICONS[category];
  return <Icon aria-hidden {...props} />;
}

/** Icon in a soft tinted tile, used for slot rows and category cards. */
export function CategoryTile({ category, className = "" }: { category: Category; className?: string }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent ${className}`}>
      <CategoryIcon category={category} className="size-5" />
    </span>
  );
}
