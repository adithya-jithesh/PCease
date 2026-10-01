import type { Metadata } from "next";
import { listParts } from "@/lib/data";
import { sanitizeSelection } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { Builder } from "./builder";

export const metadata: Metadata = {
  title: "Builder",
  description: "Pick parts slot by slot with live compatibility and power checks.",
};

export default async function BuilderPage({ searchParams }: PageProps<"/builder">) {
  const { build: buildId } = await searchParams;
  const supabase = await createClient();

  const [parts, { data: auth }] = await Promise.all([listParts({ sort: "price-asc" }), supabase.auth.getUser()]);

  // Editing a saved build: load it if it belongs to the signed-in user.
  let editing = null;
  if (typeof buildId === "string" && auth.user) {
    const { data } = await supabase
      .from("builds")
      .select("id, title, notes, parts, is_public")
      .eq("id", buildId)
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (data) editing = { ...data, parts: sanitizeSelection(data.parts) };
  }

  return <Builder parts={parts} signedIn={!!auth.user} editing={editing} />;
}
