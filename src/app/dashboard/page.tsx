import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { getPartsByIds } from "@/lib/data";
import { formatINR, timeAgo } from "@/lib/format";
import { sanitizeSelection } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import type { SavedBuild } from "@/lib/types";
import { BuildCardActions } from "./build-card-actions";

export const metadata: Metadata = { title: "My builds" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: buildRows }, { data: threads }] = await Promise.all([
    supabase.from("profiles").select("username, created_at").eq("id", user.id).single(),
    supabase.from("saved_builds").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false }),
    supabase
      .from("threads")
      .select("id, title, reply_count, score, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const builds = ((buildRows ?? []) as SavedBuild[]).map((b) => ({ ...b, parts: sanitizeSelection(b.parts) }));

  // Price every saved build at today's prices to show how it has moved.
  const ids = [...new Set(builds.flatMap((b) => Object.values(b.parts)))] as number[];
  const prices = new Map((await getPartsByIds(ids)).map((p) => [p.id, p.best_price ?? 0]));
  const currentTotal = (b: (typeof builds)[number]) =>
    Object.values(b.parts).reduce<number>((sum, id) => sum + (prices.get(id!) ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold">@{profile?.username}</h1>
          {profile && <p className="mt-1 text-sm text-muted">Member since {new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>}
        </div>
        <Link href="/builder" className="btn-primary">
          <Plus className="size-4" /> New build
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Saved builds</h2>
        {builds.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {builds.map((b) => {
              const now = currentTotal(b);
              const delta = now - b.total_inr;
              return (
                <article key={b.id} className="card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/builds/${b.id}`} className="font-display font-semibold hover:underline">
                      {b.title}
                    </Link>
                    <span className={`chip shrink-0 ${b.is_public ? "border-ok/30 text-ok" : ""}`}>
                      {b.is_public ? "public" : "private"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {Object.keys(b.parts).length} parts · updated {timeAgo(b.updated_at)}
                  </p>
                  <p className="mt-4 font-mono text-2xl font-semibold">{formatINR(now)}</p>
                  {delta !== 0 && (
                    <p className={`flex items-center gap-1 text-xs ${delta < 0 ? "text-ok" : "text-err"}`}>
                      {delta < 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                      {formatINR(Math.abs(delta))} {delta < 0 ? "cheaper" : "pricier"} than when saved
                    </p>
                  )}
                  <BuildCardActions id={b.id} isPublic={b.is_public} />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card mt-4 p-10 text-center text-muted">
            No saved builds yet. Put one together in the{" "}
            <Link href="/builder" className="text-accent underline">
              builder
            </Link>{" "}
            or let the{" "}
            <Link href="/advisor" className="text-accent underline">
              advisor
            </Link>{" "}
            draft one.
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Your threads</h2>
        {threads?.length ? (
          <ul className="card mt-4 divide-y divide-line">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/forum/${t.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2/50">
                  <span className="min-w-0 flex-1 truncate font-medium">{t.title}</span>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <MessageSquare className="size-4" /> {t.reply_count}
                  </span>
                  <span className="hidden text-sm text-muted sm:block">{timeAgo(t.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            You haven&apos;t posted yet.{" "}
            <Link href="/forum/new" className="text-accent underline">
              Ask the community
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
