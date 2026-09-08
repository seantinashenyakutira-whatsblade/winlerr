import { describe, expect, it } from "vitest";
import { isProductKey, productKeys } from "./types.js";

describe("commercial Core contracts", () => {
  it("exposes the five launch product keys", () => {
    expect(productKeys).toEqual([
      "lead-response",
      "crm-lite",
      "booking",
      "social-agent",
      "website-system",
    ]);
  });

  it("narrows known product keys and rejects unknown values", () => {
    expect(isProductKey("lead-response")).toBe(true);
    expect(isProductKey("billing")).toBe(false);
  });
});
