import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildSheet } from "@/components/build-sheet";
import { OpenInBuilder } from "@/components/open-in-builder";
import { resolveBuild } from "@/lib/data";
import { decodeSelection } from "@/lib/share";

export const metadata: Metadata = { title: "Shared build" };

export default async function SharePage({ searchParams }: PageProps<"/share">) {
  const { p } = await searchParams;
  const build = await resolveBuild(decodeSelection(typeof p === "string" ? p : null));
  if (!Object.keys(build).length) notFound();

  const selection = Object.fromEntries(Object.entries(build).map(([slot, part]) => [slot, part!.id]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Shared build</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Someone sent you a build</h1>
          <p className="mt-1 text-muted">Prices are live, so they may differ from when it was shared.</p>
        </div>
        <OpenInBuilder selection={selection} label="Remix in builder" />
      </div>
      <div className="mt-8">
        <BuildSheet build={build} />
      </div>
    </div>
  );
}
