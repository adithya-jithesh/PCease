import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewThreadForm } from "./new-thread-form";

export const metadata: Metadata = { title: "New thread" };

export default async function NewThreadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/forum/new");

  const { data: builds } = await supabase
    .from("saved_builds")
    .select("id, title, is_public")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="eyebrow">Forum</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Start a thread</h1>
      <NewThreadForm builds={builds ?? []} />
    </div>
  );
}
