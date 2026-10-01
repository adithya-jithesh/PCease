"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { FORUM_TOPICS } from "@/lib/types";

export interface FormState {
  error?: string;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const threadSchema = z.object({
  title: z.string().trim().min(5, "Titles need at least 5 characters.").max(160),
  body: z.string().trim().min(10, "Add a bit more detail (10+ characters).").max(10000),
  topic: z.enum(FORUM_TOPICS),
  build_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createThread(_: FormState, form: FormData): Promise<FormState> {
  const parsed = threadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sign in to post." };

  const { build_id, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("threads")
    .insert({ ...rest, build_id: build_id || null, author_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { error: "Couldn't create the thread. Please try again." };

  revalidatePath("/forum");
  redirect(`/forum/${data.id}`);
}

const replySchema = z.object({
  thread_id: z.coerce.number().int().positive(),
  body: z.string().trim().min(1, "Write something first.").max(5000),
});

export async function createReply(_: FormState, form: FormData): Promise<FormState> {
  const parsed = replySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sign in to reply." };

  const { error } = await supabase.from("replies").insert({ ...parsed.data, author_id: user.id });
  if (error) return { error: "Couldn't post your reply. Please try again." };

  revalidatePath(`/forum/${parsed.data.thread_id}`);
  revalidatePath("/forum");
  return {};
}

/** Clicking the same arrow twice retracts the vote. */
export async function vote(threadId: number, value: 1 | -1) {
  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/forum/${threadId}`);
  if (value !== 1 && value !== -1) return;

  const { data: existing } = await supabase
    .from("thread_votes")
    .select("value")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.value === value) {
    await supabase.from("thread_votes").delete().eq("thread_id", threadId).eq("user_id", user.id);
  } else {
    await supabase
      .from("thread_votes")
      .upsert({ thread_id: threadId, user_id: user.id, value }, { onConflict: "thread_id,user_id" });
  }

  revalidatePath(`/forum/${threadId}`);
  revalidatePath("/forum");
}

export async function deleteThread(threadId: number) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("threads").delete().eq("id", threadId).eq("author_id", user.id);
  revalidatePath("/forum");
  redirect("/forum");
}

export async function deleteReply(replyId: number, threadId: number) {
  const { supabase, user } = await requireUser();
  if (!user) return;
  await supabase.from("replies").delete().eq("id", replyId).eq("author_id", user.id);
  revalidatePath(`/forum/${threadId}`);
}
