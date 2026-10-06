import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CircleCheck,
  IndianRupee,
  ListChecks,
  MessagesSquare,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CategoryIcon, CategoryTile } from "@/components/category-icon";
import { OpenInBuilder } from "@/components/open-in-builder";
import { CATEGORY_META } from "@/lib/catalog";
import { analyzeBuild } from "@/lib/compat";
import { listParts } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { planBuild } from "@/lib/planner";
import { CATEGORIES, type Part } from "@/lib/types";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Compatibility, as you pick",
    body: "Sockets, memory generations, case clearance, cooler fit and power budget are checked live. No surprises on build day.",
  },
  {
    icon: IndianRupee,
    title: "Indian prices, side by side",
    body: "Every part's price across Amazon.in, Flipkart, MD Computers, PrimeABGB and more, with the cheapest one highlighted.",
  },
  {
    icon: Bot,
    title: "An AI advisor that knows the catalogue",
    body: "Ask anything about PC hardware. Recommendations come from parts we actually list, already checked for compatibility.",
  },
];

const STEPS = [
  { icon: MousePointerClick, title: "Pick or plan", body: "Choose parts slot by slot, or give the advisor a budget." },
  { icon: ListChecks, title: "Check the fit", body: "Every change re-runs ten compatibility and power checks." },
  { icon: IndianRupee, title: "Buy for less", body: "Jump to the cheapest store for each part." },
];

export default async function HomePage() {
  const parts: Part[] = await listParts({ sort: "price-asc" }).catch(() => []);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, parts.filter((p) => p.category === c).length]));
  // A live example build in the hero, planned from today's prices.
  const sample = parts.length ? planBuild(parts, 90000, "gaming") : null;
  const sampleChecks = sample ? analyzeBuild(sample.build).checks.filter((c) => c.level === "ok").length : 0;
  const sampleSelection = sample
    ? Object.fromEntries(Object.entries(sample.build).map(([slot, p]) => [slot, p!.id]))
    : {};

  return (
    <>
      <section className="glow">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-[fade-up_400ms_ease-out]">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-ok" /> Prices from 8 Indian retailers
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
              Build the right PC. <span className="text-accent">Pay the right price.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Pick parts with live compatibility checks, compare prices across Indian stores, and ask
              an AI advisor when you&apos;re stuck.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/builder" className="btn-primary px-5 py-2.5">
                Start a build <ArrowRight className="size-4" />
              </Link>
              <Link href="/advisor" className="btn-outline px-5 py-2.5">
                <Sparkles className="size-4" /> Ask the AI advisor
              </Link>
            </div>
            <dl className="mt-10 flex gap-10 font-mono text-sm">
              <div>
                <dt className="text-muted">Parts</dt>
                <dd className="mt-1 text-2xl font-semibold">{parts.length}</dd>
              </div>
              <div>
                <dt className="text-muted">Stores</dt>
                <dd className="mt-1 text-2xl font-semibold">8</dd>
              </div>
              <div>
                <dt className="text-muted">Checks</dt>
                <dd className="mt-1 text-2xl font-semibold">10</dd>
              </div>
            </dl>
          </div>

          {sample && (
            <div className="card animate-[fade-up_600ms_ease-out] p-5 shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Sample build</p>
                  <p className="mt-1 font-display text-lg font-semibold">₹90k gaming PC</p>
                </div>
                <span className="chip border-ok/30 bg-ok-soft text-ok">
                  <CircleCheck className="size-3" /> {sampleChecks} checks passed
                </span>
              </div>
              <ul className="mt-4 divide-y divide-line">
                {CATEGORIES.filter((slot) => sample.build[slot]).map((slot) => {
                  const part = sample.build[slot]!;
                  return (
                    <li key={slot} className="flex items-center gap-3 py-2 text-sm">
                      <CategoryIcon category={slot} className="size-4 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate">
                        {part.brand} {part.name}
                      </span>
                      <span className="font-mono text-muted">{formatINR(part.best_price)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-xs text-muted">Total</p>
                  <p className="font-mono text-2xl font-semibold">{formatINR(sample.total)}</p>
                </div>
                <OpenInBuilder selection={sampleSelection} label="Customise" />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Browse by category</h2>
          <Link href="/parts" className="text-sm text-muted hover:text-ink">
            All parts →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/parts?category=${cat}`}
              className="card group flex flex-col gap-4 p-4 transition hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="flex items-start justify-between">
                <CategoryTile category={cat} className="transition group-hover:bg-accent group-hover:text-accent-ink" />
                <span className="font-mono text-xs text-muted">{counts[cat]}</span>
              </div>
              <div>
                <p className="font-display font-semibold">{CATEGORY_META[cat].plural}</p>
                <p className="text-sm text-muted">{CATEGORY_META[cat].blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line font-mono text-sm text-accent">
                {i + 1}
              </span>
              <div>
                <h3 className="flex items-center gap-2 font-display font-semibold">
                  <Icon className="size-4 text-muted" /> {title}
                </h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6">
            <Icon className="size-5 text-accent" />
            <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-line bg-gradient-to-br from-surface-2 to-accent-soft p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
              <MessagesSquare className="size-6" /> Stuck on a choice?
            </h2>
            <p className="mt-2 max-w-md text-muted">
              Ask the AI advisor, or post your build in the forum for a second opinion from people
              who&apos;ve been there.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/advisor" className="btn-primary">
              <Sparkles className="size-4" /> Ask the advisor
            </Link>
            <Link href="/forum" className="btn-outline">
              Visit the forum
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
