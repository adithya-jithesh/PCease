"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

const SUGGESTIONS = [
  "Is the RTX 4060 enough for 1440p gaming?",
  "Ryzen 5 7600 or Core i5-14400F for a gaming PC?",
  "How much RAM do I need for video editing?",
];

export function Chat({ enabled }: { enabled: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setError(null);
    setInput("");

    const history: Message[] = [...messages, { role: "user", text: question }];
    setMessages([...history, { role: "model", text: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "The advisor is unavailable right now.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "model", text: answer }]);
      }
    } catch (e) {
      setMessages(history.slice(0, -1));
      setInput(question);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setStreaming(false);
    }
  }

  if (!enabled) {
    return (
      <div className="card p-6 text-sm text-muted">
        The AI advisor isn&apos;t configured on this deployment. Set <code className="font-mono">GEMINI_API_KEY</code> to
        turn it on.
      </div>
    );
  }

  return (
    <div className="card flex h-[520px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {!messages.length && (
          <div className="grid h-full place-items-center">
            <div className="max-w-md text-center">
              <Sparkles className="mx-auto size-6 text-accent" />
              <p className="mt-3 text-muted">Try one of these:</p>
              <div className="mt-3 flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="btn-outline justify-start text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "bg-ink text-bg" : "bg-surface-2"
              }`}
            >
              {m.text || <Loader2 className="size-4 animate-spin text-muted" />}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {error && <p className="px-5 pb-2 text-sm text-err">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Ask about parts, builds or upgrades…"
          className="input rounded-full"
          aria-label="Your question"
        />
        <button disabled={streaming || !input.trim()} className="btn-primary size-10 shrink-0 p-0" aria-label="Send">
          {streaming ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </button>
      </form>
    </div>
  );
}
