"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Bot, Check, Loader2, Plus, RotateCcw, Sparkles, Wrench } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import type { AdvisorEvent } from "@/lib/advisor/events";
import { humanize, resolveSlug } from "@/lib/advisor/slugs";
import { formatINR } from "@/lib/format";
import { useBuild } from "@/lib/stores";
import { toast } from "@/lib/toast";
import { CATEGORIES, type Category } from "@/lib/types";

export interface CatalogItem {
  id: number;
  slug: string;
  brand: string;
  name: string;
  category: Category;
  price: number | null;
}

interface Message {
  role: "user" | "model";
  text: string;
  status?: string;
  build?: Record<string, number>;
  error?: string;
}

const STORAGE_KEY = "pcease:advisor-chat";

const SUGGESTIONS = [
  "Build me a ₹80,000 gaming PC",
  "Which GPU should I pair with a Ryzen 5 7600?",
  "Is my current build balanced?",
  "RTX 4060 vs RX 7600: which is better value?",
];

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

export function Chat({ enabled, catalog }: { enabled: boolean; catalog: CatalogItem[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const { build } = useBuild();
  const buildCount = Object.keys(build).length;
  const bySlug = useRef(new Map(catalog.map((c) => [c.slug, c])));
  const byId = useRef(new Map(catalog.map((c) => [c.id, c])));

  // Restore the conversation after navigating away and back (same tab only).
  useEffect(() => {
    const saved = loadHistory();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage
    if (saved.length) setMessages(saved);
  }, []);

  useEffect(() => {
    if (streaming) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Storage unavailable; the chat still works for this visit.
    }
  }, [messages, streaming]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setInput("");

    const history: Message[] = [...messages.filter((m) => !m.error), { role: "user", text: question }];
    let reply: Message = { role: "model", text: "", status: "Thinking…" };
    const update = (patch: Partial<Message>) => {
      reply = { ...reply, ...patch };
      setMessages([...history, reply]);
    };
    update({});
    setStreaming(true);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-12).map(({ role, text }) => ({ role, text })),
          build,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "The advisor is unavailable right now.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AdvisorEvent;
          if (event.t === "text") update({ text: reply.text + event.v, status: undefined });
          else if (event.t === "status") update({ status: event.v });
          else if (event.t === "build") update({ build: event.v });
          else if (event.t === "error") update({ error: event.v, status: undefined });
        }
      }
      update({ status: undefined });
    } catch (e) {
      update({ status: undefined, error: e instanceof Error ? e.message : "Something went wrong." });
      setInput(question);
    } finally {
      setStreaming(false);
      textarea.current?.focus();
    }
  }

  function reset() {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  if (!enabled) {
    return (
      <div className="card p-8 text-center">
        <Bot className="mx-auto size-8 text-muted" />
        <h2 className="mt-3 font-display text-lg font-semibold">The AI advisor isn&apos;t switched on yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Add a <code className="font-mono text-ink">GEMINI_API_KEY</code> to the server environment to enable
          it. Meanwhile, the budget planner works without it.
        </p>
        <Link href="/advisor?tab=planner" className="btn-primary mt-5">
          Open the budget planner
        </Link>
      </div>
    );
  }

  return (
    <div className="card flex h-[min(72vh,760px)] min-h-[480px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">PCease AI advisor</p>
          <p className="truncate text-xs text-muted">
            {buildCount
              ? `Can see your current build (${buildCount} part${buildCount > 1 ? "s" : ""})`
              : "Answers PC hardware questions using our catalogue"}
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} disabled={streaming} className="btn-ghost px-3 text-xs text-muted">
            <RotateCcw className="size-3.5" /> New chat
          </button>
        )}
      </div>

      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {!messages.length && (
          <div className="grid h-full place-items-center">
            <div className="w-full max-w-lg text-center">
              <h2 className="font-display text-xl font-semibold">What are you building?</h2>
              <p className="mt-1 text-sm text-muted">
                Ask about parts, compatibility, upgrades or a whole build. Recommendations come from
                parts we list, at today&apos;s prices.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 text-left text-sm transition hover:border-accent hover:text-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-sm whitespace-pre-wrap">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line text-accent">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                {m.text && <AdvisorMarkdown text={m.text} bySlug={bySlug.current} />}
                {m.status && (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="size-3.5 animate-spin" /> {m.status}
                  </p>
                )}
                {m.build && !m.status && <SuggestedBuild selection={m.build} byId={byId.current} />}
                {m.error && <p className="rounded-xl bg-err-soft px-3 py-2 text-sm text-err">{m.error}</p>}
              </div>
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-line p-3"
      >
        <textarea
          ref={textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Ask about parts, builds or upgrades…"
          aria-label="Your question"
          className="input max-h-40 min-h-10 resize-none py-2.5 [field-sizing:content]"
        />
        <button
          disabled={streaming || !input.trim()}
          className="btn-primary size-10 shrink-0 p-0"
          aria-label="Send"
        >
          {streaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </button>
      </form>
    </div>
  );
}

/** Markdown answer where [[slug]] references become live part chips. */
function AdvisorMarkdown({ text, bySlug }: { text: string; bySlug: Map<string, CatalogItem> }) {
  // Models occasionally vary the casing of slugs, so match case-insensitively.
  const withLinks = text.replace(/\[\[([a-z0-9-]+)\]\]/gi, (_, slug: string) => {
    const normalized = slug.toLowerCase();
    return `[${normalized}](part:${normalized})`;
  });

  return (
    <div className="prose-advisor text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (url.startsWith("part:") ? url : defaultUrlTransform(url))}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("part:")) {
              const item = resolveSlug(href.slice(5), bySlug);
              return item ? <PartChip item={item} /> : <span className="font-medium">{humanize(href.slice(5))}</span>;
            }
            return (
              <a href={href} target="_blank" rel="noreferrer nofollow" className="text-accent underline">
                {children}
              </a>
            );
          },
        }}
      >
        {withLinks}
      </ReactMarkdown>
    </div>
  );
}

function PartChip({ item }: { item: CatalogItem }) {
  const { build, setPart } = useBuild();
  const inBuild = build[item.category] === item.id;

  return (
    <span className="mx-0.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-surface-2 py-0.5 pr-1 pl-2 align-middle text-[13px] whitespace-nowrap">
      <CategoryIcon category={item.category} className="size-3.5 shrink-0 text-accent" />
      <Link href={`/parts/${item.slug}`} className="truncate font-medium hover:text-accent">
        {item.brand} {item.name}
      </Link>
      <span className="font-mono text-muted">{formatINR(item.price)}</span>
      <button
        type="button"
        onClick={() => {
          setPart(item.category, inBuild ? null : item.id);
          if (!inBuild) {
            toast(`Added ${item.name} to your build.`, {
              tone: "success",
              action: { label: "View build", href: "/builder" },
            });
          }
        }}
        aria-label={inBuild ? `Remove ${item.name} from build` : `Add ${item.name} to build`}
        title={inBuild ? "In your build" : "Add to build"}
        className={`grid size-5 place-items-center rounded-md ${inBuild ? "bg-ok-soft text-ok" : "text-muted hover:bg-accent hover:text-accent-ink"}`}
      >
        {inBuild ? <Check className="size-3" /> : <Plus className="size-3" />}
      </button>
    </span>
  );
}

function SuggestedBuild({ selection, byId }: { selection: Record<string, number>; byId: Map<number, CatalogItem> }) {
  const { replace } = useBuild();
  const items = CATEGORIES.map((c) => byId.get(selection[c])).filter(Boolean) as CatalogItem[];
  if (!items.length) return null;
  const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0);

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-soft/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Suggested build · {items.length} parts</p>
        <p className="font-mono font-semibold">{formatINR(total)}</p>
      </div>
      <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-2 truncate">
            <CategoryIcon category={i.category} className="size-3.5 shrink-0" /> {i.brand} {i.name}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          replace(selection as Partial<Record<Category, number>>);
          toast("Loaded the suggested build into the builder.", {
            tone: "success",
            action: { label: "Open builder", href: "/builder" },
          });
        }}
        className="btn-primary mt-3"
      >
        <Wrench className="size-4" /> Load into builder
      </button>
    </div>
  );
}
