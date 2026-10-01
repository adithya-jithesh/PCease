import type { Metadata } from "next";
import { listParts } from "@/lib/data";
import { Planner } from "./planner";
import { Chat } from "./chat";

export const metadata: Metadata = {
  title: "Advisor",
  description: "Get a complete, compatible PC build for your budget, or ask the AI advisor anything.",
};

export default async function AdvisorPage() {
  const parts = await listParts({ sort: "price-asc" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow">Advisor</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Plan a build around your budget</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pick a budget and what you&apos;ll use the PC for. The planner tries every CPU and GPU
        pairing, completes each with compatible parts, and keeps the strongest one that fits.
      </p>

      <div className="mt-8">
        <Planner parts={parts} />
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">Ask the advisor</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Questions about parts, upgrades or trade-offs? The AI advisor knows the PCease catalogue
          and current prices.
        </p>
        <div className="mt-6">
          <Chat enabled={!!process.env.GEMINI_API_KEY} />
        </div>
      </section>
    </div>
  );
}
