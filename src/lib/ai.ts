import { GoogleGenAI } from "@google/genai";

/**
 * Gemini model preferences, best first. When a model is overloaded (503) or
 * out of quota (429) we fall through to the next one. Override with
 * comma-separated lists in the environment when Google retires a model.
 */
const list = (value: string | undefined, fallback: string) =>
  (value || fallback)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

export const MODELS = {
  /** The advisor: needs function calling. */
  chat: list(process.env.GEMINI_CHAT_MODELS, "gemini-3.8-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite"),
  /** Quick yes/no classification. */
  fast: list(process.env.GEMINI_FAST_MODELS, "gemini-3.5-flash-lite,gemini-3.1-flash-lite"),
  /** Price lookups: needs Google Search grounding. */
  prices: list(process.env.GEMINI_PRICE_MODELS, "gemini-3.8-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite"),
};

export function createGemini(apiKey: string, timeoutMs = 60_000) {
  return new GoogleGenAI({ apiKey, httpOptions: { timeout: timeoutMs } });
}

function statusOf(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err && typeof err.status === "number") return err.status;
  const match = String(err instanceof Error ? err.message : err).match(/"code":\s*(\d{3})/);
  return match ? Number(match[1]) : null;
}

/** Overloaded, rate-limited, out of quota or timed out: worth trying another model. */
export function isRetryable(err: unknown): boolean {
  const status = statusOf(err);
  if (status && [429, 500, 503, 504].includes(status)) return true;
  const message = String(err instanceof Error ? err.message : err);
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|high demand|aborted|timed? ?out/i.test(message);
}

export function isQuotaError(err: unknown): boolean {
  return statusOf(err) === 429 || /RESOURCE_EXHAUSTED|quota/i.test(String(err instanceof Error ? err.message : err));
}

/** Run `call` with each model in turn until one succeeds or a non-retryable error occurs. */
export async function withModelFallback<T>(
  models: string[],
  call: (model: string) => Promise<T>,
): Promise<{ result: T; model: string }> {
  let lastError: unknown = new Error("No Gemini models configured");
  for (const model of models) {
    try {
      return { result: await call(model), model };
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) throw err;
      console.warn(`Gemini ${model} unavailable, trying the next model`, statusOf(err) ?? "");
    }
  }
  throw lastError;
}
