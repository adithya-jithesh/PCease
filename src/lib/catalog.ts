import type { Category, Part, Specs } from "./types";

interface SpecField {
  key: string;
  label: string;
  format?: (value: Specs[string]) => string;
  /** For comparisons: which direction is better. */
  better?: "higher" | "lower";
}

interface CategoryMeta {
  label: string;
  plural: string;
  blurb: string;
  fields: SpecField[];
}

const list = (v: Specs[string]) => (Array.isArray(v) ? v.join(", ") : String(v));
const unit = (suffix: string) => (v: Specs[string]) => `${v} ${suffix}`;
const yesNo = (v: Specs[string]) => (v ? "Yes" : "No");
const capacity = (v: Specs[string]) => {
  const gb = Number(v);
  return gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`;
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  cpu: {
    label: "CPU",
    plural: "Processors",
    blurb: "The brain of the build",
    fields: [
      { key: "socket", label: "Socket" },
      { key: "cores", label: "Cores", better: "higher" },
      { key: "threads", label: "Threads", better: "higher" },
      { key: "base_ghz", label: "Base clock", format: unit("GHz"), better: "higher" },
      { key: "boost_ghz", label: "Boost clock", format: unit("GHz"), better: "higher" },
      { key: "memory", label: "Memory support", format: list },
      { key: "igpu", label: "Integrated graphics", format: yesNo },
    ],
  },
  gpu: {
    label: "GPU",
    plural: "Graphics cards",
    blurb: "Frames, pixels and ray tracing",
    fields: [
      { key: "vram_gb", label: "VRAM", format: unit("GB"), better: "higher" },
      { key: "memory_type", label: "Memory type" },
      { key: "boost_mhz", label: "Boost clock", format: unit("MHz"), better: "higher" },
      { key: "length_mm", label: "Length", format: unit("mm"), better: "lower" },
    ],
  },
  motherboard: {
    label: "Motherboard",
    plural: "Motherboards",
    blurb: "Where everything plugs in",
    fields: [
      { key: "socket", label: "Socket" },
      { key: "chipset", label: "Chipset" },
      { key: "form_factor", label: "Form factor" },
      { key: "memory", label: "Memory" },
      { key: "ram_slots", label: "RAM slots", better: "higher" },
      { key: "m2_slots", label: "M.2 slots", better: "higher" },
      { key: "wifi", label: "Wi-Fi", format: yesNo },
    ],
  },
  ram: {
    label: "Memory",
    plural: "Memory kits",
    blurb: "Room to multitask",
    fields: [
      { key: "memory", label: "Type" },
      { key: "capacity_gb", label: "Capacity", format: unit("GB"), better: "higher" },
      { key: "modules", label: "Modules" },
      { key: "speed_mts", label: "Speed", format: unit("MT/s"), better: "higher" },
      { key: "cas", label: "CAS latency", format: (v) => `CL${v}`, better: "lower" },
    ],
  },
  storage: {
    label: "Storage",
    plural: "Storage",
    blurb: "Games, projects and boot times",
    fields: [
      { key: "capacity_gb", label: "Capacity", format: capacity, better: "higher" },
      { key: "interface", label: "Interface" },
      { key: "read_mbs", label: "Sequential read", format: unit("MB/s"), better: "higher" },
      { key: "write_mbs", label: "Sequential write", format: unit("MB/s"), better: "higher" },
    ],
  },
  psu: {
    label: "Power supply",
    plural: "Power supplies",
    blurb: "Clean, stable power",
    fields: [
      { key: "wattage", label: "Wattage", format: unit("W"), better: "higher" },
      { key: "efficiency", label: "Efficiency" },
      { key: "modular", label: "Modularity" },
    ],
  },
  case: {
    label: "Case",
    plural: "Cases",
    blurb: "Airflow and looks",
    fields: [
      { key: "form_factors", label: "Fits boards", format: list },
      { key: "max_gpu_mm", label: "Max GPU length", format: unit("mm"), better: "higher" },
      { key: "max_cooler_mm", label: "Max cooler height", format: unit("mm"), better: "higher" },
      { key: "fans_included", label: "Fans included", better: "higher" },
    ],
  },
  cooler: {
    label: "CPU cooler",
    plural: "CPU coolers",
    blurb: "Keep temperatures in check",
    fields: [
      { key: "type", label: "Type" },
      { key: "sockets", label: "Sockets", format: list },
      { key: "tdp_rating", label: "Rated TDP", format: unit("W"), better: "higher" },
      { key: "height_mm", label: "Height", format: unit("mm") },
      { key: "radiator_mm", label: "Radiator", format: unit("mm") },
    ],
  },
};

export function formatSpec(category: Category, key: string, value: Specs[string]): string {
  if (value === null || value === undefined || value === "") return "—";
  const field = CATEGORY_META[category].fields.find((f) => f.key === key);
  return field?.format ? field.format(value) : String(value);
}

/** Two or three headline specs for compact cards. */
export function headlineSpecs(part: Part): string[] {
  const s = part.specs;
  switch (part.category) {
    case "cpu":
      return [`${s.cores}C / ${s.threads}T`, `${s.boost_ghz} GHz`, String(s.socket)];
    case "gpu":
      return [`${s.vram_gb} GB ${s.memory_type}`, `${part.watts} W`];
    case "motherboard":
      return [String(s.socket), String(s.form_factor), String(s.memory)];
    case "ram":
      return [`${s.capacity_gb} GB`, `${s.memory}-${s.speed_mts}`, `CL${s.cas}`];
    case "storage":
      return [formatSpec("storage", "capacity_gb", s.capacity_gb), String(s.interface)];
    case "psu":
      return [`${s.wattage} W`, String(s.efficiency)];
    case "case":
      return [list(s.form_factors), `GPU ≤ ${s.max_gpu_mm} mm`];
    case "cooler":
      return [String(s.type), `${s.tdp_rating} W TDP`];
  }
}
