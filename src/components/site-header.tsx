import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export const NAV = [
  { href: "/parts", label: "Parts" },
  { href: "/builder", label: "Builder" },
  { href: "/compare", label: "Compare" },
  { href: "/advisor", label: "Advisor" },
  { href: "/forum", label: "Forum" },
];

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="btn-ghost text-muted hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu email={user.email ?? ""} />
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          )}
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
