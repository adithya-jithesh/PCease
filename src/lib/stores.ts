import { useCallback, useSyncExternalStore } from "react";
import type { BuildSelection, Category } from "./types";

/**
 * Tiny localStorage-backed store that stays in sync across components and tabs.
 */
function createStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } | null = null;

  const read = (): T => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (cache && cache.raw === raw) return cache.value;
    let value = fallback;
    try {
      value = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      // Corrupt entry; start fresh.
    }
    cache = { raw, value };
    return value;
  };

  const write = (value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode, quota). Keep working in memory.
      cache = { raw: JSON.stringify(value), value };
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { read, write, subscribe, fallback };
}

const buildStore = createStore<BuildSelection>("pcease:build", {});
const compareStore = createStore<number[]>("pcease:compare", []);

export const MAX_COMPARE = 4;

export function useBuild() {
  const build = useSyncExternalStore(buildStore.subscribe, buildStore.read, () => buildStore.fallback);

  const setPart = useCallback((slot: Category, id: number | null) => {
    const next = { ...buildStore.read() };
    if (id == null) delete next[slot];
    else next[slot] = id;
    buildStore.write(next);
  }, []);

  const replace = useCallback((selection: BuildSelection) => buildStore.write(selection), []);
  const clear = useCallback(() => buildStore.write({}), []);

  return { build, setPart, replace, clear };
}

export function useCompare() {
  const ids = useSyncExternalStore(
    compareStore.subscribe,
    compareStore.read,
    () => compareStore.fallback,
  );

  const toggle = useCallback((id: number) => {
    const current = compareStore.read();
    if (current.includes(id)) compareStore.write(current.filter((x) => x !== id));
    else if (current.length < MAX_COMPARE) compareStore.write([...current, id]);
  }, []);

  const remove = useCallback(
    (id: number) => compareStore.write(compareStore.read().filter((x) => x !== id)),
    [],
  );
  const clear = useCallback(() => compareStore.write([]), []);

  return { ids, toggle, remove, clear, full: ids.length >= MAX_COMPARE };
}
