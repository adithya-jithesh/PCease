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

/**
 * Overloaded, rate-limited, out of quota, timed out, or the connection dropped
 * mid-stream: worth trying again or with another model.
 */
export function isRetryable(err: unknown): boolean {
  const status = statusOf(err);
  if (status && [429, 500, 503, 504].includes(status)) return true;
  const message = String(err instanceof Error ? err.message : err);
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|high demand|aborted|timed? ?out|Incomplete JSON|fetch failed|ECONNRESET|socket|terminated|network/i.test(
    message,
  );
}

// Models that just failed with a busy/quota error are tried last for a while,
// so every request doesn't wait on the same overloaded model first.
const COOLDOWN_MS = 60_000;
const busyUntil = new Map<string, number>();

export function markBusy(model: string) {
  busyUntil.set(model, Date.now() + COOLDOWN_MS);
}

/** Preference order with recently-busy models moved to the end. */
export function orderByAvailability(models: string[]): string[] {
  const now = Date.now();
  const ready = models.filter((m) => (busyUntil.get(m) ?? 0) <= now);
  const cooling = models.filter((m) => (busyUntil.get(m) ?? 0) > now);
  return [...ready, ...cooling];
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
  for (const model of orderByAvailability(models)) {
    try {
      return { result: await call(model), model };
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) throw err;
      markBusy(model);
      console.warn(`Gemini ${model} unavailable, trying the next model`, statusOf(err) ?? "");
    }
  }
  throw lastError;
}
