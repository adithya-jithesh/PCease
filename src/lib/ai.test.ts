import { describe, expect, it } from "vitest";
import { isQuotaError, isRetryable, markBusy, orderByAvailability, withModelFallback } from "./ai";

const apiError = (code: number, status: string) =>
  new Error(JSON.stringify({ error: { code, message: "x", status } }));

describe("isRetryable", () => {
  it("retries overload, quota and timeouts but not bad requests", () => {
    expect(isRetryable(apiError(503, "UNAVAILABLE"))).toBe(true);
    expect(isRetryable(apiError(429, "RESOURCE_EXHAUSTED"))).toBe(true);
    expect(isRetryable(new Error("This operation was aborted"))).toBe(true);
    expect(isRetryable(new Error("Incomplete JSON segment at the end"))).toBe(true);
    expect(isRetryable(new TypeError("fetch failed"))).toBe(true);
    expect(isRetryable(apiError(404, "NOT_FOUND"))).toBe(false);
    expect(isRetryable(apiError(400, "INVALID_ARGUMENT"))).toBe(false);
  });

  it("spots quota errors", () => {
    expect(isQuotaError(apiError(429, "RESOURCE_EXHAUSTED"))).toBe(true);
    expect(isQuotaError(apiError(503, "UNAVAILABLE"))).toBe(false);
  });
});

describe("withModelFallback", () => {
  it("moves past busy models to the first one that works", async () => {
    const tried: string[] = [];
    const { result, model } = await withModelFallback(["a", "b", "c"], async (m) => {
      tried.push(m);
      if (m !== "c") throw apiError(503, "UNAVAILABLE");
      return "ok";
    });
    expect(result).toBe("ok");
    expect(model).toBe("c");
    expect(tried).toEqual(["a", "b", "c"]);
  });

  it("stops at a non-retryable error", async () => {
    const tried: string[] = [];
    await expect(
      withModelFallback(["a", "b"], async (m) => {
        tried.push(m);
        throw apiError(400, "INVALID_ARGUMENT");
      }),
    ).rejects.toThrow();
    expect(tried).toEqual(["a"]);
  });

  it("throws the last error when every model is busy", async () => {
    await expect(withModelFallback(["a", "b"], async () => Promise.reject(apiError(429, "RESOURCE_EXHAUSTED")))).rejects.toThrow(
      /RESOURCE_EXHAUSTED/,
    );
  });
});

describe("orderByAvailability", () => {
  it("moves recently busy models to the end", () => {
    markBusy("cooldown-test-a");
    expect(orderByAvailability(["cooldown-test-a", "cooldown-test-b", "cooldown-test-c"])).toEqual([
      "cooldown-test-b",
      "cooldown-test-c",
      "cooldown-test-a",
    ]);
  });
});
