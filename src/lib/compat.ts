import type { Category, ResolvedBuild } from "./types";

export type CheckLevel = "ok" | "warn" | "error";

export interface Check {
  level: CheckLevel;
  title: string;
  detail: string;
}

export interface BuildAnalysis {
  checks: Check[];
  estimatedWatts: number;
  recommendedPsu: number;
  total: number;
  missing: Category[];
}

const REQUIRED: Category[] = ["cpu", "motherboard", "ram", "storage", "psu", "case"];

// Fallback draw (W) when a part has no figure, plus a fixed allowance for
// fans, USB devices and transient spikes.
const DEFAULT_WATTS: Partial<Record<Category, number>> = {
  cpu: 65,
  gpu: 150,
  motherboard: 45,
  ram: 8,
  storage: 6,
  cooler: 5,
};
const PLATFORM_OVERHEAD = 40;
// Below this margin, GPU transient spikes can trip the PSU's protection.
const PSU_MINIMUM_MARGIN = 1.1;
const PSU_HEADROOM = 1.3;

/** Budget chipsets whose power delivery struggles with high-end CPUs. */
export const ENTRY_CHIPSETS = ["H610", "A520"];

const str = (v: unknown) => (v == null ? undefined : String(v));
const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : undefined);

export function estimateWatts(build: ResolvedBuild): number {
  let total = PLATFORM_OVERHEAD;
  for (const [slot, part] of Object.entries(build)) {
    if (!part || slot === "psu" || slot === "case") continue;
    total += part.watts ?? DEFAULT_WATTS[slot as Category] ?? 0;
  }
  return total;
}

/** Round up to the next common PSU size. */
export function recommendPsu(watts: number): number {
  const target = watts * PSU_HEADROOM;
  const sizes = [450, 550, 650, 750, 850, 1000, 1200, 1600];
  return sizes.find((s) => s >= target) ?? sizes[sizes.length - 1];
}

export function analyzeBuild(build: ResolvedBuild): BuildAnalysis {
  const checks: Check[] = [];
  const { cpu, gpu, motherboard: board, ram, psu, case: chassis, cooler } = build;

  if (cpu && board) {
    const cpuSocket = str(cpu.specs.socket);
    const boardSocket = str(board.specs.socket);
    checks.push(
      cpuSocket === boardSocket
        ? { level: "ok", title: "CPU fits the motherboard", detail: `Both use ${cpuSocket}.` }
        : {
            level: "error",
            title: "Socket mismatch",
            detail: `${cpu.name} needs ${cpuSocket}, but the ${board.name} is ${boardSocket}.`,
          },
    );

    const chipset = str(board.specs.chipset);
    if ((cpu.tier ?? 0) >= 4 && chipset && ENTRY_CHIPSETS.includes(chipset)) {
      checks.push({
        level: "warn",
        title: "Entry-level board for a high-end CPU",
        detail: `${chipset} boards have basic power delivery and may throttle the ${cpu.name}. A B-series board is a safer match.`,
      });
    }

    const supported = arr(cpu.specs.memory) ?? [];
    const boardMem = str(board.specs.memory);
    if (boardMem && supported.length && !supported.includes(boardMem)) {
      checks.push({
        level: "error",
        title: "Memory generation mismatch",
        detail: `${cpu.name} supports ${supported.join("/")}, but the board takes ${boardMem}.`,
      });
    }
  }

  if (ram && board) {
    const ramType = str(ram.specs.memory);
    const boardType = str(board.specs.memory);
    checks.push(
      ramType === boardType
        ? { level: "ok", title: "Memory is compatible", detail: `${ramType} on a ${boardType} board.` }
        : {
            level: "error",
            title: "Wrong memory type",
            detail: `This kit is ${ramType}; the motherboard only accepts ${boardType}.`,
          },
    );
    const modules = num(ram.specs.modules) ?? 0;
    const slots = num(board.specs.ram_slots) ?? 0;
    if (modules > slots) {
      checks.push({
        level: "error",
        title: "Not enough RAM slots",
        detail: `The kit has ${modules} sticks but the board has ${slots} slots.`,
      });
    }
  } else if (ram && cpu && !board) {
    const supported = arr(cpu.specs.memory) ?? [];
    const ramType = str(ram.specs.memory);
    if (ramType && supported.length && !supported.includes(ramType)) {
      checks.push({
        level: "error",
        title: "Wrong memory type",
        detail: `${cpu.name} doesn't support ${ramType}.`,
      });
    }
  }

  if (board && chassis) {
    const formFactor = str(board.specs.form_factor);
    const fits = arr(chassis.specs.form_factors) ?? [];
    checks.push(
      formFactor && fits.includes(formFactor)
        ? { level: "ok", title: "Board fits the case", detail: `${formFactor} is supported.` }
        : {
            level: "error",
            title: "Board doesn't fit the case",
            detail: `The case supports ${fits.join(", ")}, not ${formFactor}.`,
          },
    );
  }

  if (gpu && chassis) {
    const length = num(gpu.specs.length_mm);
    const max = num(chassis.specs.max_gpu_mm);
    if (length && max) {
      checks.push(
        length <= max
          ? {
              level: "ok",
              title: "GPU clears the case",
              detail: `${length} mm card, ${max - length} mm to spare.`,
            }
          : {
              level: "error",
              title: "GPU too long",
              detail: `The card is ${length} mm; the case allows ${max} mm.`,
            },
      );
    }
  }

  if (cooler && cpu) {
    const sockets = arr(cooler.specs.sockets) ?? [];
    const socket = str(cpu.specs.socket);
    if (socket && !sockets.includes(socket)) {
      checks.push({
        level: "error",
        title: "Cooler doesn't mount",
        detail: `${cooler.name} has no ${socket} bracket.`,
      });
    }
    const rating = num(cooler.specs.tdp_rating);
    if (rating && cpu.watts && rating < cpu.watts) {
      checks.push({
        level: "warn",
        title: "Cooler is undersized",
        detail: `Rated for ${rating} W; the CPU can pull ${cpu.watts} W.`,
      });
    }
  }

  if (cooler && chassis) {
    const height = num(cooler.specs.height_mm);
    const max = num(chassis.specs.max_cooler_mm);
    if (height && max && height > max) {
      checks.push({
        level: "error",
        title: "Cooler too tall",
        detail: `${height} mm cooler in a case that fits ${max} mm.`,
      });
    }
  }

  if (cpu && !cooler && cpu.specs.cooler_included) {
    checks.push({
      level: "ok",
      title: "Stock cooler included",
      detail: `${cpu.name} ships with a cooler that's fine at stock settings.`,
    });
  } else if (cpu && !cooler) {
    checks.push({
      level: "warn",
      title: "No CPU cooler",
      detail: "Most chips here don't ship with a cooler worth using. Add one.",
    });
  }

  if (cpu && !gpu && !cpu.specs.igpu) {
    checks.push({
      level: "error",
      title: "No display output",
      detail: `${cpu.name} has no integrated graphics, so you'll need a graphics card.`,
    });
  }

  const estimatedWatts = estimateWatts(build);
  const recommendedPsu = recommendPsu(estimatedWatts);

  if (psu) {
    const wattage = num(psu.specs.wattage) ?? 0;
    if (wattage < estimatedWatts * PSU_MINIMUM_MARGIN) {
      checks.push({
        level: "error",
        title: "Power supply too weak",
        detail: `Estimated draw is ${estimatedWatts} W, leaving no margin for spikes on a ${wattage} W unit.`,
      });
    } else if (wattage < recommendedPsu) {
      checks.push({
        level: "warn",
        title: "Tight on power",
        detail: `${wattage} W works, but ${recommendedPsu} W leaves comfortable headroom.`,
      });
    } else {
      checks.push({
        level: "ok",
        title: "Power supply has headroom",
        detail: `${wattage} W for an estimated ${estimatedWatts} W load.`,
      });
    }
  }

  if (cpu?.tier && gpu?.tier) {
    const gap = gpu.tier - cpu.tier;
    if (gap >= 2) {
      checks.push({
        level: "warn",
        title: "CPU may hold the GPU back",
        detail: "At 1080p especially, a faster CPU would let this card stretch its legs.",
      });
    } else if (gap <= -2) {
      checks.push({
        level: "warn",
        title: "GPU is the weak link",
        detail: "For gaming, shifting budget from the CPU to the graphics card pays off more.",
      });
    } else {
      checks.push({
        level: "ok",
        title: "Balanced CPU and GPU",
        detail: "Neither part should bottleneck the other.",
      });
    }
  }

  const total = Object.values(build).reduce((sum, p) => sum + (p?.best_price ?? 0), 0);
  const missing = REQUIRED.filter((slot) => !build[slot]);

  const order: Record<CheckLevel, number> = { error: 0, warn: 1, ok: 2 };
  checks.sort((a, b) => order[a.level] - order[b.level]);

  return { checks, estimatedWatts, recommendedPsu, total, missing };
}
