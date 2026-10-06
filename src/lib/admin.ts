import "server-only";
import type { User } from "@supabase/supabase-js";
import { getUser } from "./supabase/server";

/** Admins are listed by email in ADMIN_EMAILS (comma-separated). */
export function isAdmin(user: Pick<User, "email"> | null | undefined): boolean {
  const email = user?.email?.toLowerCase();
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}

export async function requireAdmin() {
  const user = await getUser();
  if (!isAdmin(user)) throw new Error("Not authorised");
  return user!;
}
