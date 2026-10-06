import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server jobs (price updates, admin edits).
 * Bypasses row-level security, so never import this into client code.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") throw new Error("createAdminClient is server-only");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Price updates need SUPABASE_SECRET_KEY (Supabase → Project Settings → API keys → secret key) in the server environment.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
