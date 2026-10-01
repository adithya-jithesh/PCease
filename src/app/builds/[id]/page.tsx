import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildSheet } from "@/components/build-sheet";
import { OpenInBuilder } from "@/components/open-in-builder";
import { resolveBuild } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { sanitizeSelection } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

async function loadBuild(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  // RLS only returns public builds, or private ones to their owner.
  const { data } = await supabase
    .from("saved_builds")
    .select("id, title, notes, parts, updated_at, is_public, owner:profiles(username)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/builds/[id]">): Promise<Metadata> {
  const build = await loadBuild((await params).id);
  return build ? { title: build.title } : {};
}

export default async function BuildPage({ params }: PageProps<"/builds/[id]">) {
  const build = await loadBuild((await params).id);
  if (!build) notFound();

  const selection = sanitizeSelection(build.parts);
  const resolved = await resolveBuild(selection);
  const owner = build.owner as unknown as { username: string } | null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{build.is_public ? "Public build" : "Private build"}</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{build.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {owner && <>by @{owner.username} · </>}updated {timeAgo(build.updated_at)}
          </p>
        </div>
        <OpenInBuilder selection={selection} label="Remix in builder" />
      </div>
      {build.notes && <p className="mt-6 max-w-2xl whitespace-pre-line text-muted">{build.notes}</p>}
      <div className="mt-8">
        <BuildSheet build={resolved} />
      </div>
    </div>
  );
}
