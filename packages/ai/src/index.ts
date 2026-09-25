/**
 * @winlerr/ai — provider-agnostic LLM abstraction.
 *
 * Route ALL provider calls through this package. Application code must
 * never import `openai` / `anthropic` SDKs directly.
 *
 * Transport adapters ported from wanie (MIT License,
 * Copyright (c) 2026 asepindrak, https://github.com/asepindrak/wanie).
 * See README.md for attribution and porting notes.
 */
import { AiError } from "./errors.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createOllamaProvider } from "./providers/ollama.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createOpenRouterProvider } from "./providers/openrouter.js";
import type { Provider, ProviderConfig, ProviderName } from "./types.js";

export type {
  ChatParams,
  ChatResult,
  Message,
  ModelInfo,
  Provider,
  ProviderConfig,
  ProviderName,
  Role,
  ToolDefinition,
  Usage,
} from "./types.js";
export {
  ChatParamsSchema,
  ChatResultSchema,
  MessageSchema,
  RoleSchema,
  ToolDefinitionSchema,
  UsageSchema,
} from "./schemas.js";
export type {
  ValidatedChatParams,
  ValidatedChatResult,
  ValidatedMessage,
  ValidatedRole,
  ValidatedToolDefinition,
  ValidatedUsage,
} from "./schemas.js";
export {
  AiError,
  EmptyResponseError,
  MissingApiKeyError,
  ProviderRequestError,
  redactSecrets,
} from "./errors.js";
export type { AiErrorCode } from "./errors.js";
export {
  UsageMeter,
  configurePricing,
  estimateCost,
  getUsage,
  recordDefault,
  reset,
} from "./usage.js";
export type { ModelPricing, UsageSnapshot } from "./usage.js";
export { createAnthropicProvider } from "./providers/anthropic.js";
export { createOllamaProvider } from "./providers/ollama.js";
export { createOpenAIProvider } from "./providers/openai.js";
export { createOpenRouterProvider } from "./providers/openrouter.js";

const PROVIDER_NAMES: ReadonlySet<string> = new Set(["openrouter", "openai", "anthropic", "ollama"]);

function isProviderName(value: string): value is ProviderName {
  return PROVIDER_NAMES.has(value);
}

export function createProvider(name: ProviderName, config: ProviderConfig = {}): Provider {
  switch (name) {
    case "openrouter":
      return createOpenRouterProvider(config);
    case "openai":
      return createOpenAIProvider(config);
    case "anthropic":
      return createAnthropicProvider(config);
    case "ollama":
      return createOllamaProvider(config);
  }
}

export interface DefaultResolution {
  provider: ProviderName;
  model?: string;
  fallbackModel?: string;
}

/** Resolve the default provider from env. Unknown values fall back safely. */
export function resolveDefaultResolution(env: Record<string, string | undefined> = process.env): DefaultResolution {
  const raw = env["AI_DEFAULT_PROVIDER"] ?? "openrouter";
  return {
    provider: isProviderName(raw) ? raw : "openrouter",
    model: env["AI_DEFAULT_MODEL"],
    fallbackModel: env["AI_FALLBACK_MODEL"],
  };
}

/** Create the env-configured default provider. Throws AiError on misuse. */
export function createDefaultProvider(config: ProviderConfig = {}): Provider {
  const resolution = resolveDefaultResolution();
  if (!isProviderName(resolution.provider)) {
    throw new AiError("AI_INVALID_PARAMS", `Unknown provider: ${resolution.provider}`);
  }
  return createProvider(resolution.provider, {
    ...config,
    model: config.model ?? resolution.model,
  });
}
