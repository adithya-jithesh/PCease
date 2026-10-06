"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBuild } from "@/lib/stores";

export const NAV = [
  { href: "/parts", label: "Parts" },
  { href: "/builder", label: "Builder" },
  { href: "/compare", label: "Compare" },
  { href: "/advisor", label: "AI Advisor" },
  { href: "/forum", label: "Forum" },
];

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Number of parts in the working build, shown as a badge next to "Builder". */
export function BuildCount({ className = "" }: { className?: string }) {
  const { build } = useBuild();
  const count = Object.keys(build).length;
  if (!count) return null;
  return (
    <span
      className={`grid min-w-5 place-items-center rounded-full bg-accent px-1.5 font-mono text-[10px] leading-5 font-semibold text-accent-ink ${className}`}
      aria-label={`${count} parts in your build`}
    >
      {count}
    </span>
  );
}

export function NavLinks() {
  const isActive = useIsActive();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`btn px-3 ${active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
          >
            {item.label}
            {item.href === "/builder" && <BuildCount />}
          </Link>
        );
      })}
    </nav>
  );
}
