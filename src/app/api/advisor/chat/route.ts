import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { listParts } from "@/lib/data";
import { CATEGORY_META, headlineSpecs } from "@/lib/catalog";

const MODEL = "gemini-2.5-flash";

const body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
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

async function catalogueContext() {
  const parts = await listParts({ sort: "price-asc" });
  return parts
    .map(
      (p) =>
        `- [${CATEGORY_META[p.category].label}] ${p.brand} ${p.name} (${headlineSpecs(p).join(", ")}): ` +
        (p.best_price ? `₹${p.best_price}` : "no price"),
    )
    .join("\n");
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

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = `You are the PCease advisor, helping people in India plan and upgrade desktop PCs.
- Prices are in Indian rupees (₹). Mention Indian retailers where relevant.
- Prefer parts from the catalogue below and quote its prices; say so when you go beyond it.
- Be concise: under 250 words, short paragraphs or bullet points, plain text (no markdown headings).
- If a question isn't about PC hardware, politely steer back to PC building.

Catalogue (best current price):
${await catalogueContext()}`;

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: parsed.data.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      config: { systemInstruction, maxOutputTokens: 1024, temperature: 0.6 },
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
            }
          } catch (err) {
            console.error("advisor stream failed", err);
            controller.enqueue(encoder.encode("\n\n[The answer was cut short. Please try again.]"));
          } finally {
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("advisor request failed", err);
    return Response.json({ error: "The advisor is unavailable right now." }, { status: 502 });
  }
}
