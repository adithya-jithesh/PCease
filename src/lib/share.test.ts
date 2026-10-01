import { describe, expect, it } from "vitest";
import { decodeSelection, encodeSelection, sanitizeSelection } from "./share";

describe("share links", () => {
  it("round-trips a selection in slot order", () => {
    const selection = { gpu: 4, cpu: 12, case: 9 };
    const encoded = encodeSelection(selection);
    expect(encoded).toBe("cpu:12,gpu:4,case:9");
    expect(decodeSelection(encoded)).toEqual(selection);
  });

  it("ignores unknown slots and bad ids", () => {
    expect(decodeSelection("cpu:1,monitor:3,gpu:-2,ram:abc,psu:7")).toEqual({ cpu: 1, psu: 7 });
    expect(decodeSelection(null)).toEqual({});
  });

  it("sanitizes untrusted objects", () => {
    expect(sanitizeSelection({ cpu: "5", gpu: 1.5, evil: 3 })).toEqual({ cpu: 5 });
    expect(sanitizeSelection("nope")).toEqual({});
  });
});
