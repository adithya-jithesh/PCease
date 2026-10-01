import Link from "next/link";
import { ArrowRight, Cpu, IndianRupee, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";
import { CATEGORY_META } from "@/lib/catalog";
import { getCatalogueStats } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Compatibility, as you pick",
    body: "Sockets, memory generations, case clearance, cooler fit and power budget are checked live. No surprises on build day.",
  },
  {
    icon: IndianRupee,
    title: "Indian prices, side by side",
    body: "See every part's price across Amazon.in, Flipkart, MD Computers, PrimeABGB and more, with the cheapest one highlighted.",
  },
  {
    icon: Sparkles,
    title: "A planner that knows your budget",
    body: "Tell the advisor what you'll use it for and how much you want to spend. It drafts a complete, compatible build.",
  },
];

export default async function HomePage() {
  const stats = await getCatalogueStats().catch(() => ({ parts: 0, retailers: 0 }));

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24">
        <p className="eyebrow">PC building, without the guesswork</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
          Spec it. Price it. <span className="text-accent">Build it.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Plan your next PC with live compatibility checks and prices from the stores you actually
          buy from.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/builder" className="btn-primary px-5 py-2.5">
            Start a build <ArrowRight className="size-4" />
          </Link>
          <Link href="/advisor" className="btn-outline px-5 py-2.5">
            <Sparkles className="size-4" /> Plan by budget
          </Link>
        </div>
        <dl className="mt-12 flex gap-10 font-mono text-sm">
          <div>
            <dt className="text-muted">Parts tracked</dt>
            <dd className="mt-1 text-2xl font-semibold">{stats.parts}</dd>
          </div>
          <div>
            <dt className="text-muted">Retailers</dt>
            <dd className="mt-1 text-2xl font-semibold">{stats.retailers}</dd>
          </div>
          <div>
            <dt className="text-muted">Checks per build</dt>
            <dd className="mt-1 text-2xl font-semibold">10</dd>
          </div>
        </dl>
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
              className="card group p-4 transition hover:-translate-y-0.5 hover:border-ink"
            >
              <p className="font-mono text-xs text-accent">{CATEGORY_META[cat].label}</p>
              <p className="mt-6 font-display text-lg font-semibold">{CATEGORY_META[cat].plural}</p>
              <p className="text-sm text-muted">{CATEGORY_META[cat].blurb}</p>
            </Link>
          ))}
        </div>
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
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-ink p-8 text-bg sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
              <MessagesSquare className="size-6" /> Stuck on a choice?
            </h2>
            <p className="mt-2 max-w-md opacity-70">
              Post your build in the forum and get a second opinion from people who&apos;ve been
              there.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/forum" className="btn bg-bg text-ink hover:opacity-90">
              Visit the forum
            </Link>
            <Link href="/parts?category=cpu" className="btn border border-bg/30 hover:border-bg">
              <Cpu className="size-4" /> Browse CPUs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
