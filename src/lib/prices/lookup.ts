import type { GoogleGenAI } from "@google/genai";
import { hostOf, parseOffers, type RawOffer, type RetailerRef } from "./validate";

export const PRICE_MODEL = "gemini-2.5-flash";

export interface LookupPart {
  brand: string;
  name: string;
  category: string;
  specs: Record<string, unknown>;
}

export interface LookupResult {
  offers: RawOffer[];
  /** Hostnames of the pages Google Search returned as evidence. */
  evidenceHosts: string[];
}

function describe(part: LookupPart): string {
  const s = part.specs;
  const bits: string[] = [];
  if (s.vram_gb) bits.push(`${s.vram_gb}GB`);
  if (s.capacity_gb) bits.push(`${s.capacity_gb}GB`);
  if (s.wattage) bits.push(`${s.wattage}W`);
  if (s.memory && typeof s.memory === "string") bits.push(s.memory);
  return `${part.brand} ${part.name}${bits.length ? ` (${bits.join(", ")})` : ""}`;
}

/** Ask Gemini, grounded in Google Search, for today's price at each of our retailers. */
export async function lookupPrices(
  ai: GoogleGenAI,
  part: LookupPart,
  retailers: (RetailerRef & { name: string })[],
): Promise<LookupResult> {
  const stores = retailers.map((r) => `- ${r.slug}: ${r.name} (${hostOf(r.homepage)})`).join("\n");

  const prompt = `Find the current selling price in India of this PC part: ${describe(part)} [${part.category}].

Check these stores:
${stores}

Rules:
- Only report a price you found on that store's own listing for this exact product and variant (not bundles, combos, used, refurbished or a different model/capacity).
- Use the price a buyer pays today, in Indian rupees, as a whole number.
- Skip a store if you can't find this exact product there. Don't guess.

Reply with JSON only, no other text:
{"offers":[{"store":"<store id from the list>","price_inr":12345,"in_stock":true,"url":"<product page url>"}]}`;

  const res = await ai.models.generateContent({
    model: PRICE_MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }], temperature: 0 },
  });

  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const evidenceHosts = chunks
    .flatMap((c) => [c.web?.title, hostOf(c.web?.uri ?? "")])
    .filter((h): h is string => !!h)
    .map((h) => h.replace(/^www\./, "").toLowerCase());

  return { offers: parseOffers(res.text ?? ""), evidenceHosts: [...new Set(evidenceHosts)] };
}
