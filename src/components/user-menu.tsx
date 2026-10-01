"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full border border-line bg-surface hover:border-ink"
      >
        <UserRound className="size-4" />
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-60 p-1.5 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-muted">{email}</p>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
          >
            <LayoutGrid className="size-4" /> My builds
          </Link>
          <form action={signOut}>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
