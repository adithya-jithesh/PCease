"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BuildCount, NAV, useIsActive } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const isActive = useIsActive();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost relative px-2"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
        {!open && <BuildCount className="absolute -top-0.5 -right-0.5" />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-14 border-b border-line bg-bg px-4 py-3 shadow-xl shadow-black/40">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium ${
                isActive(item.href) ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2"
              }`}
            >
              {item.label}
              {item.href === "/builder" && <BuildCount />}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
