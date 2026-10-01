import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs space-y-2">
          <Logo />
          <p className="text-sm text-muted">
            Plan a PC around Indian prices. Prices are indicative; always confirm at checkout.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link href="/parts" className="text-muted hover:text-ink">Parts</Link>
          <Link href="/advisor" className="text-muted hover:text-ink">Advisor</Link>
          <Link href="/builder" className="text-muted hover:text-ink">Builder</Link>
          <Link href="/forum" className="text-muted hover:text-ink">Forum</Link>
          <Link href="/compare" className="text-muted hover:text-ink">Compare</Link>
          <a
            href="https://github.com/adithya-jithesh/PCease"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
