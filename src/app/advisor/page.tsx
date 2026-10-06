import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Sparkles } from "lucide-react";
import { listParts } from "@/lib/data";
import { Chat, type CatalogItem } from "./chat";
import { Planner } from "./planner";

export const metadata: Metadata = {
  title: "AI Advisor",
  description: "Ask the AI advisor about PC parts and compatibility, or plan a complete build for your budget.",
};

const TABS = [
  { id: "chat", label: "Ask the AI", icon: Sparkles },
  { id: "planner", label: "Budget planner", icon: Calculator },
] as const;

export default async function AdvisorPage({ searchParams }: PageProps<"/advisor">) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "planner" ? "planner" : "chat";
  const parts = await listParts({ sort: "price-asc" });
  const catalog: CatalogItem[] = parts.map((p) => ({
    id: p.id,
    slug: p.slug,
    brand: p.brand,
    name: p.name,
    category: p.category,
    price: p.best_price,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow">Advisor</p>
      <h1 className="mt-2 font-display text-3xl font-bold">
        {tab === "chat" ? "Ask anything about your next PC" : "Plan a build around your budget"}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {tab === "chat"
          ? "The AI advisor only recommends parts we list, checks them for compatibility, and quotes today's prices."
          : "Pick a budget and a use case. The planner tries every CPU and GPU pairing, completes each with compatible parts, and keeps the strongest one that fits."}
      </p>

      <div className="mt-6 inline-flex rounded-full bg-surface-2 p-1" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={id === "chat" ? "/advisor" : "/advisor?tab=planner"}
            role="tab"
            aria-selected={tab === id}
            className={`btn px-4 py-1.5 ${tab === id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "chat" ? (
          <Chat enabled={!!process.env.GEMINI_API_KEY} catalog={catalog} />
        ) : (
          <Planner parts={parts} />
        )}
      </div>
    </div>
  );
}
