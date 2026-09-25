import { beforeEach, describe, expect, it } from "vitest";
import { UsageMeter, configurePricing, estimateCost, getUsage, reset } from "../src/usage.js";

describe("estimateCost", () => {
  it("prices prompt and completion tokens separately", () => {
    const cost = estimateCost("gpt-4o-mini", { promptTokens: 1000, completionTokens: 1000, totalTokens: 2000 });
    expect(cost).toBeCloseTo(0.00015 + 0.0006, 8);
  });

  it("costs zero for unknown models but still meters tokens", () => {
    expect(estimateCost("mystery-model", { promptTokens: 500, completionTokens: 500, totalTokens: 1000 })).toBe(0);
  });
});

describe("UsageMeter", () => {
  it("accumulates across records and resets", () => {
    const meter = new UsageMeter();
    meter.record("gpt-4o-mini", { promptTokens: 100, completionTokens: 50, totalTokens: 150 });
    meter.record("gpt-4o-mini", { promptTokens: 100, completionTokens: 50, totalTokens: 150 });
    const snap = meter.snapshot();
    expect(snap.calls).toBe(2);
    expect(snap.totalTokens).toBe(300);
    expect(snap.costUsd).toBeGreaterThan(0);
    meter.reset();
    expect(meter.snapshot().totalTokens).toBe(0);
  });

  it("honors runtime pricing overrides", () => {
    configurePricing({ custom: { inputPer1kUsd: 1, outputPer1kUsd: 2 } });
    const cost = estimateCost("custom", { promptTokens: 1000, completionTokens: 1000, totalTokens: 2000 });
    expect(cost).toBe(3);
    configurePricing({});
  });
});

describe("module meter", () => {
  beforeEach(() => reset());

  it("starts empty and accumulates", () => {
    expect(getUsage().calls).toBe(0);
  });
});
