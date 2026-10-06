import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; href: string };
  tone?: "default" | "success";
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Show a short-lived notification. Newest replaces the oldest beyond three. */
export function toast(message: string, options: Omit<Toast, "id" | "message"> = {}) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, ...options }];
  emit();
  setTimeout(() => dismissToast(id), 3500);
}

const EMPTY: Toast[] = [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
}
