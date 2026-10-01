import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEnabledProviders } from "@/lib/supabase/auth-settings";
import { getUser } from "@/lib/supabase/server";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const raw = typeof params.next === "string" ? params.next : "";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  if (await getUser()) redirect(next);
  const providers = await getEnabledProviders();

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Welcome to PCease</h1>
      <p className="mt-2 text-sm text-muted">
        Save builds, share them, and join the forum.
      </p>
      {params.error && (
        <p className="mt-4 rounded-xl bg-err-soft px-3 py-2 text-sm text-err">
          Sign-in didn&apos;t complete. Please try again.
        </p>
      )}
      <AuthForm next={next} google={providers.google} />
    </div>
  );
}
