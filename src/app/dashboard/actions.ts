"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ownerClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, userId: user.id };
}

export async function setBuildVisibility(id: string, isPublic: boolean) {
  const { supabase, userId } = await ownerClient();
  await supabase.from("saved_builds").update({ is_public: isPublic }).eq("id", id).eq("owner_id", userId);
  revalidatePath("/dashboard");
  revalidatePath(`/builds/${id}`);
}

export async function duplicateBuild(id: string) {
  const { supabase, userId } = await ownerClient();
  const { data } = await supabase
    .from("saved_builds")
    .select("title, notes, parts, total_inr")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();
  if (!data) return;
  await supabase.from("saved_builds").insert({
    ...data,
    title: `${data.title} (copy)`.slice(0, 80),
    owner_id: userId,
    is_public: false,
  });
  revalidatePath("/dashboard");
}

export async function deleteBuild(id: string) {
  const { supabase, userId } = await ownerClient();
  await supabase.from("saved_builds").delete().eq("id", id).eq("owner_id", userId);
  revalidatePath("/dashboard");
}
