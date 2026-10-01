import "server-only";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Which sign-in providers are switched on in the Supabase dashboard, so the UI
 * never offers one that would fail. Cached briefly; defaults to email only.
 */
export async function getEnabledProviders(): Promise<{ email: boolean; google: boolean }> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseKey },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`settings ${res.status}`);
    const { external } = (await res.json()) as { external?: Record<string, boolean> };
    return { email: external?.email ?? true, google: external?.google ?? false };
  } catch {
    return { email: true, google: false };
  }
}
