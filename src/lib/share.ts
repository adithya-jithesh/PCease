import { CATEGORIES, type BuildSelection, type Category } from "./types";

/** `{cpu: 12, gpu: 4}` -> `cpu:12,gpu:4` (stable slot order). */
export function encodeSelection(selection: BuildSelection): string {
  return CATEGORIES.filter((c) => selection[c])
    .map((c) => `${c}:${selection[c]}`)
    .join(",");
}

export function decodeSelection(value: string | undefined | null): BuildSelection {
  const selection: BuildSelection = {};
  if (!value) return selection;
  for (const pair of value.split(",")) {
    const [slot, raw] = pair.split(":");
    const id = Number(raw);
    if (CATEGORIES.includes(slot as Category) && Number.isInteger(id) && id > 0) {
      selection[slot as Category] = id;
    }
  }
  return selection;
}

/** Parse untrusted JSON (e.g. from a form) into a clean selection. */
export function sanitizeSelection(input: unknown): BuildSelection {
  const selection: BuildSelection = {};
  if (!input || typeof input !== "object") return selection;
  for (const slot of CATEGORIES) {
    const id = Number((input as Record<string, unknown>)[slot]);
    if (Number.isInteger(id) && id > 0) selection[slot] = id;
  }
  return selection;
}
