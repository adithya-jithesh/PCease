"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveBuild } from "@/lib/data";
import { sanitizeSelection } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";

const input = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Give your build a name.").max(80),
  notes: z.string().trim().max(2000).optional(),
  isPublic: z.boolean(),
  parts: z.record(z.string(), z.unknown()),
});

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveBuild(raw: z.input<typeof input>): Promise<SaveResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to save builds." };

  // Re-resolve on the server so the stored total can't be tampered with.
  const selection = sanitizeSelection(parsed.data.parts);
  const resolved = await resolveBuild(selection);
  const parts = Object.fromEntries(Object.entries(resolved).map(([slot, p]) => [slot, p!.id]));
  if (!Object.keys(parts).length) return { ok: false, error: "Add at least one part first." };
  const total = Object.values(resolved).reduce((sum, p) => sum + (p?.best_price ?? 0), 0);

  const row = {
    title: parsed.data.title,
    notes: parsed.data.notes || null,
    is_public: parsed.data.isPublic,
    parts,
    total_inr: total,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = parsed.data.id
    ? await supabase
        .from("builds")
        .update(row)
        .eq("id", parsed.data.id)
        .eq("owner_id", user.id)
        .select("id")
        .single()
    : await supabase
        .from("builds")
        .insert({ ...row, owner_id: user.id })
        .select("id")
        .single();

  if (error || !data) return { ok: false, error: "Couldn't save the build. Please try again." };

  revalidatePath("/dashboard");
  revalidatePath(`/builds/${data.id}`);
  return { ok: true, id: data.id };
}
