/**
 * @winlerr/ai — token usage accumulation + cost estimation.
 *
 * Costs come from a static per-model pricing table (USD per 1k tokens),
 * overridable at runtime via `configurePricing()` or the `AI_PRICING_JSON`
 * env var (a JSON object of `{ "<model>": { inputPer1kUsd, outputPer1kUsd } }`).
 * Unknown models cost 0 — they are still metered by token counts.
 * A module-level meter backs `getUsage()` / `reset()` for tests.
 */
import type { Usage } from "./types.js";

export interface ModelPricing {
  inputPer1kUsd: number;
  outputPer1kUsd: number;
}

const DEFAULT_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPer1kUsd: 0.00015, outputPer1kUsd: 0.0006 },
  "gpt-4o": { inputPer1kUsd: 0.0025, outputPer1kUsd: 0.01 },
  "gpt-4": { inputPer1kUsd: 0.03, outputPer1kUsd: 0.06 },
  "gpt-3.5-turbo": { inputPer1kUsd: 0.0005, outputPer1kUsd: 0.0015 },
  "claude-3-5-haiku-20241022": { inputPer1kUsd: 0.0008, outputPer1kUsd: 0.004 },
  "claude-3-5-sonnet-20241022": { inputPer1kUsd: 0.003, outputPer1kUsd: 0.015 },
  "claude-2": { inputPer1kUsd: 0.008, outputPer1kUsd: 0.024 },
  "llama2": { inputPer1kUsd: 0, outputPer1kUsd: 0 },
  "mistral": { inputPer1kUsd: 0, outputPer1kUsd: 0 },
};

function loadEnvPricing(): Record<string, ModelPricing> {
  try {
    const raw = process.env["AI_PRICING_JSON"];
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Record<string, ModelPricing> = {};
    for (const [model, pricing] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof pricing !== "object" || pricing === null) continue;
      const p = pricing as Record<string, unknown>;
      if (typeof p["inputPer1kUsd"] === "number" && typeof p["outputPer1kUsd"] === "number") {
        out[model] = { inputPer1kUsd: p["inputPer1kUsd"], outputPer1kUsd: p["outputPer1kUsd"] };
      }
    }
    return out;
  } catch {
    return {};
  }
}

let overrides: Record<string, ModelPricing> = loadEnvPricing();

export function configurePricing(table: Record<string, ModelPricing>): void {
  overrides = { ...table };
}

function pricingFor(model: string): ModelPricing {
  return overrides[model] ?? DEFAULT_PRICING[model] ?? { inputPer1kUsd: 0, outputPer1kUsd: 0 };
}

export function estimateCost(model: string, usage: Usage): number {
  const pricing = pricingFor(model);
  return (
    (usage.promptTokens / 1000) * pricing.inputPer1kUsd +
    (usage.completionTokens / 1000) * pricing.outputPer1kUsd
  );
}

export interface UsageSnapshot extends Usage {
  costUsd: number;
  calls: number;
}

export class UsageMeter {
  private promptTokens = 0;
  private completionTokens = 0;
  private costUsd = 0;
  private calls = 0;

  record(model: string, usage: Usage): UsageSnapshot {
    this.promptTokens += usage.promptTokens;
    this.completionTokens += usage.completionTokens;
    this.costUsd += estimateCost(model, usage);
    this.calls += 1;
    return this.snapshot();
  }

  snapshot(): UsageSnapshot {
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.promptTokens + this.completionTokens,
      costUsd: this.costUsd,
      calls: this.calls,
    };
  }

  reset(): void {
    this.promptTokens = 0;
    this.completionTokens = 0;
    this.costUsd = 0;
    this.calls = 0;
  }
}

const defaultMeter = new UsageMeter();

export function getUsage(): UsageSnapshot {
  return defaultMeter.snapshot();
}

export function reset(): void {
  defaultMeter.reset();
}

export function recordDefault(model: string, usage: Usage): UsageSnapshot {
  return defaultMeter.record(model, usage);
}
