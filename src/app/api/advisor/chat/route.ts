import { GoogleGenAI, type Content, type Part as GenPart } from "@google/genai";
import { z } from "zod";
import type { AdvisorEvent } from "@/lib/advisor/events";
import { GUARD_INSTRUCTION, OFF_TOPIC_REPLY, systemInstruction } from "@/lib/advisor/prompt";
import { runTool, TOOL_DECLARATIONS, TOOL_STATUS } from "@/lib/advisor/tools";
import { listParts } from "@/lib/data";
import { sanitizeSelection } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import type { Part } from "@/lib/types";

const MODEL = "gemini-2.5-flash";
const GUARD_MODEL = "gemini-2.5-flash-lite";
const MAX_TOOL_ROUNDS = 6;

const body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().min(1).max(4000) }))
    .min(1)
    .max(24),
  build: z.record(z.string(), z.unknown()).optional(),
});

// Best-effort per-instance rate limit. Use a shared store (e.g. Upstash) if you
// run many instances and need it to be exact.
const WINDOW_MS = 60_000;
const LIMIT = 15;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

/** Cheap classifier so off-topic questions never reach the main model. Fails open. */
async function isInScope(ai: GoogleGenAI, messages: { role: string; text: string }[]) {
  try {
    const transcript = messages
      .slice(-4)
      .map((m) => `${m.role === "user" ? "User" : "Advisor"}: ${m.text.slice(0, 1000)}`)
      .join("\n");
    const res = await ai.models.generateContent({
      model: GUARD_MODEL,
      contents: transcript,
      config: {
        systemInstruction: GUARD_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: { in_scope: { type: "boolean" } },
          required: ["in_scope"],
        },
        temperature: 0,
        maxOutputTokens: 20,
      },
    });
    return JSON.parse(res.text ?? "{}").in_scope !== false;
  } catch (err) {
    console.warn("advisor guard failed, continuing", err);
    return true;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "The AI advisor isn't configured." }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "You're asking quickly! Wait a minute and try again." }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { messages } = parsed.data;

  const parts = await listParts({ sort: "price-asc" });
  const byId = new Map(parts.map((p) => [p.id, p]));
  const currentBuild = Object.values(sanitizeSelection(parsed.data.build))
    .map((id) => byId.get(id!))
    .filter(Boolean) as Part[];

  const supabase = await createClient();
  const loadListings = async (slug: string) => {
    const part = parts.find((p) => p.slug === slug);
    if (!part) return [];
    const { data } = await supabase
      .from("listings")
      .select("price_inr, in_stock, retailer:retailers(name)")
      .eq("part_id", part.id)
      .order("price_inr");
    return (data ?? []).map((l) => ({
      retailer: (l.retailer as unknown as { name: string } | null)?.name ?? "Unknown",
      price_inr: l.price_inr,
      in_stock: l.in_stock,
    }));
  };

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AdvisorEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        if (!(await isInScope(ai, messages))) {
          send({ t: "text", v: OFF_TOPIC_REPLY });
          return;
        }

        const contents: Content[] = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
        const config = {
          systemInstruction: systemInstruction(currentBuild),
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          temperature: 0.4,
          maxOutputTokens: 2048,
        };

        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const response = await ai.models.generateContentStream({ model: MODEL, contents, config });
          const modelParts: GenPart[] = [];

          for await (const chunk of response) {
            for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
              modelParts.push(part);
              if (part.text && !part.thought) send({ t: "text", v: part.text });
            }
          }

          const calls = modelParts.filter((p) => p.functionCall).map((p) => p.functionCall!);
          if (!calls.length) return;
          if (round === MAX_TOOL_ROUNDS) {
            send({ t: "text", v: "\n\nI couldn't finish looking that up. Try asking a narrower question." });
            return;
          }

          contents.push({ role: "model", parts: modelParts });
          const responses: GenPart[] = [];
          for (const call of calls) {
            const name = call.name ?? "";
            const args = (call.args ?? {}) as Record<string, unknown>;
            send({ t: "status", v: TOOL_STATUS[name]?.(args) ?? "Working…" });
            const result = await runTool(name, args, { parts, loadListings });
            if (result.build) send({ t: "build", v: result.build as Record<string, number> });
            responses.push({ functionResponse: { id: call.id, name, response: result.response } });
          }
          contents.push({ role: "user", parts: responses });
        }
      } catch (err) {
        console.error("advisor request failed", err);
        send({ t: "error", v: "The advisor ran into a problem. Please try again." });
      } finally {
        send({ t: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
