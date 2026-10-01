import { analyzeBuild, estimateWatts, recommendPsu } from "./compat";
import type { Part, ResolvedBuild } from "./types";

export const USE_CASES = {
  gaming: { label: "Gaming", cpu: 1.5, gpu: 3, ramGb: 16, storageGb: 1000 },
  streaming: { label: "Gaming + streaming", cpu: 2, gpu: 2.5, ramGb: 32, storageGb: 1000 },
  creator: { label: "Video & 3D work", cpu: 3, gpu: 1.5, ramGb: 32, storageGb: 2000 },
  office: { label: "Office & study", cpu: 2, gpu: 0.5, ramGb: 16, storageGb: 500 },
} as const;

export type UseCase = keyof typeof USE_CASES;

export interface Plan {
  build: ResolvedBuild;
  total: number;
  leftover: number;
  notes: string[];
}

const price = (p: Part | undefined) => p?.best_price ?? 0;
const priced = (parts: Part[]) => parts.filter((p) => p.best_price != null);
const cheapest = <T extends Part>(parts: T[]) =>
  [...parts].sort((a, b) => price(a) - price(b))[0] as T | undefined;
const sum = (build: ResolvedBuild) => Object.values(build).reduce((s, p) => s + price(p), 0);
const spec = (p: Part, key: string) => p.specs[key];

/** Fill in the cheapest parts that make `cpu` + `gpu` a complete, compatible PC. */
function completePlatform(
  cpu: Part,
  gpu: Part | undefined,
  pool: Record<Part["category"], Part[]>,
  useCase: UseCase,
  lean = false,
): ResolvedBuild | null {
  // Lean mode drops to the cheapest working memory/storage and the stock cooler.
  const want = lean ? { ramGb: 0, storageGb: 0 } : USE_CASES[useCase];
  const memory = spec(cpu, "memory") as string[];

  const board = cheapest(
    pool.motherboard.filter(
      (b) => spec(b, "socket") === spec(cpu, "socket") && memory.includes(String(spec(b, "memory"))),
    ),
  );
  if (!board) return null;

  const ramOptions = pool.ram.filter((r) => spec(r, "memory") === spec(board, "memory"));
  const ram =
    cheapest(ramOptions.filter((r) => Number(spec(r, "capacity_gb")) >= want.ramGb)) ?? cheapest(ramOptions);
  const storage =
    cheapest(pool.storage.filter((s) => Number(spec(s, "capacity_gb")) >= want.storageGb)) ??
    cheapest(pool.storage);

  const chassis = cheapest(
    pool.case.filter((c) => {
      const fits = spec(c, "form_factors") as string[];
      const gpuOk = !gpu || Number(spec(gpu, "length_mm")) <= Number(spec(c, "max_gpu_mm"));
      return fits.includes(String(spec(board, "form_factor"))) && gpuOk;
    }),
  );

  const stockCoolerOk = lean && cpu.specs.cooler_included === true;
  const cooler = stockCoolerOk
    ? undefined
    : cheapest(
    pool.cooler.filter((c) => {
      const sockets = spec(c, "sockets") as string[];
      const height = Number(spec(c, "height_mm") ?? 0);
      return (
        sockets.includes(String(spec(cpu, "socket"))) &&
        Number(spec(c, "tdp_rating")) >= (cpu.watts ?? 65) &&
        (!chassis || !height || height <= Number(spec(chassis, "max_cooler_mm")))
      );
    }),
  );

  if (!ram || !storage || !chassis || (!cooler && !stockCoolerOk)) return null;

  const partial: ResolvedBuild = { cpu, gpu, motherboard: board, ram, storage, case: chassis };
  if (cooler) partial.cooler = cooler;
  const needed = recommendPsu(estimateWatts(partial));
  const psu = cheapest(pool.psu.filter((p) => Number(spec(p, "wattage")) >= needed));
  if (!psu) return null;

  return { ...partial, psu };
}

/** Swap parts for better ones while money is left, in order of usefulness. */
function spendLeftover(build: ResolvedBuild, budget: number, pool: Record<Part["category"], Part[]>, useCase: UseCase) {
  const upgrades: [keyof ResolvedBuild, (a: Part, b: Part) => boolean][] = [
    // More or faster memory of the same generation
    ["ram", (cur, next) =>
      spec(next, "memory") === spec(cur, "memory") &&
      (Number(spec(next, "capacity_gb")) > Number(spec(cur, "capacity_gb")) ||
        Number(spec(next, "speed_mts")) > Number(spec(cur, "speed_mts")))],
    // Bigger or faster SSD
    ["storage", (cur, next) =>
      Number(spec(next, "capacity_gb")) > Number(spec(cur, "capacity_gb")) ||
      Number(spec(next, "read_mbs")) > Number(spec(cur, "read_mbs"))],
    // Gold-rated PSU of at least the same wattage
    ["psu", (cur, next) =>
      String(spec(next, "efficiency")).includes("Gold") &&
      !String(spec(cur, "efficiency")).includes("Gold") &&
      Number(spec(next, "wattage")) >= Number(spec(cur, "wattage"))],
    // Better-cooling case
    ["case", (cur, next) => Number(spec(next, "fans_included")) > Number(spec(cur, "fans_included"))],
  ];
  if (useCase === "gaming") upgrades.reverse();

  for (const [slot, isBetter] of upgrades) {
    const current = build[slot];
    if (!current) continue;
    const candidates = pool[slot]
      .filter((p) => price(p) > price(current) && isBetter(current, p))
      .sort((a, b) => price(a) - price(b));
    for (const next of candidates) {
      const trial = { ...build, [slot]: next };
      if (sum(trial) > budget) break;
      if (analyzeBuild(trial).checks.some((c) => c.level === "error")) continue;
      build = trial;
    }
  }
  return build;
}

export function planBuild(parts: Part[], budget: number, useCase: UseCase): Plan | null {
  const pool = Object.fromEntries(
    (["cpu", "gpu", "motherboard", "ram", "storage", "psu", "case", "cooler"] as const).map((c) => [
      c,
      priced(parts.filter((p) => p.category === c)),
    ]),
  ) as Record<Part["category"], Part[]>;

  const weights = USE_CASES[useCase];
  let best: { build: ResolvedBuild; score: number; total: number } | null = null;

  for (const cpu of pool.cpu) {
    // Office builds can skip the graphics card when the CPU has graphics built in.
    const gpus: (Part | undefined)[] =
      useCase === "office" && spec(cpu, "igpu") ? [undefined, ...pool.gpu] : pool.gpu;

    for (const gpu of gpus) {
      let build = completePlatform(cpu, gpu, pool, useCase);
      if (!build || sum(build) > budget) build = completePlatform(cpu, gpu, pool, useCase, true);
      if (!build) continue;
      const total = sum(build);
      if (total > budget) continue;

      const score = (cpu.tier ?? 1) * weights.cpu + (gpu?.tier ?? 0) * weights.gpu;
      if (!best || score > best.score || (score === best.score && total < best.total)) {
        best = { build, score, total };
      }
    }
  }

  if (!best) return null;

  const build = spendLeftover(best.build, budget, pool, useCase);
  if (!build.gpu) delete build.gpu;
  if (!build.cooler) delete build.cooler;
  const total = sum(build);
  const notes: string[] = [];
  if (!build.cooler) notes.push("Uses the CPU's bundled cooler to save money. An aftermarket cooler is an easy upgrade later.");
  if (!build.gpu) notes.push("Uses the CPU's integrated graphics. Add a graphics card later if you start gaming.");
  if (build.cpu?.tier && build.gpu?.tier && build.gpu.tier - build.cpu.tier >= 2)
    notes.push("Leans heavily on the GPU, which is the right call for high-resolution gaming.");
  if (budget - total > 5000) notes.push("There's room left over. Consider a better monitor or peripherals.");

  return { build, total, leftover: budget - total, notes };
}
