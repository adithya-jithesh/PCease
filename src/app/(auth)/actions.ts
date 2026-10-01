"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
  /** Set when the account exists but its email hasn't been confirmed yet. */
  pendingEmail?: string;
}

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Passwords need at least 8 characters."),
});

const signUpSchema = credentials.extend({
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,24}$/i, "Usernames are 3-24 letters, numbers or underscores."),
});

/** Only allow internal redirects after sign-in. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

async function siteOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.code === "email_not_confirmed") {
    return {
      error: "Confirm your email before signing in. Check your inbox (and spam) for the link.",
      pendingEmail: parsed.data.email,
    };
  }
  if (error) return { error: "That email and password don't match." };

  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username.toLowerCase() },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(form.get("next")))}`,
    },
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { error: "We can't send more confirmation emails right now. Please try again in an hour." };
  }
  if (error) return { error: error.message };

  // With email confirmation on, there's no session yet.
  if (!data.session) {
    return {
      message: "Check your inbox (and spam) for a confirmation link to finish signing up.",
      pendingEmail: parsed.data.email,
    };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")));
}

export async function resendConfirmation(email: string): Promise<AuthState> {
  const parsed = z.string().trim().email().safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard` },
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { error: "Too many emails sent recently. Wait a few minutes and try again." };
  }
  if (error) return { error: error.message };
  return { message: `Sent a new confirmation link to ${parsed.data}.` };
}

export async function signInWithGoogle(form: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(form.get("next")))}`,
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
