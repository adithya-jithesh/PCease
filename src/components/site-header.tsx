import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { getUser } from "@/lib/supabase/server";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <NavLinks />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu email={user.email ?? ""} admin={isAdmin(user)} />
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
