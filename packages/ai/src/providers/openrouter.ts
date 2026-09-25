/**
 * OpenRouter provider — OpenAI-compatible chat completions.
 *
 * Ported from wanie (MIT License, Copyright (c) 2026 asepindrak,
 * https://github.com/asepindrak/wanie — server/ai/llm-adapters/openrouter.js):
 * retry-on-5xx-or-empty-choices and text extraction preserved;
 * rewritten in strict TypeScript with token-usage mapping.
 * No SDK dependency — plain fetch.
 */
import { MissingApiKeyError } from "../errors.js";
import type { ChatParams, ChatResult, ModelInfo, Provider, ProviderConfig } from "../types.js";
import { bearer, extractChoicesText, extractTokenUsage, hasChoices, postJsonWithRetry, trimSlash } from "./base.js";

const DEFAULT_HOST = "https://openrouter.ai";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

function isRetriable(status: number | undefined, bodyText: string, data: unknown): boolean {
  if (status !== undefined && status >= 500) return true;
  if (data !== null && !hasChoices(data)) return true;
  return /no choices|server_error|upstream|overloaded/i.test(bodyText);
}

export function createOpenRouterProvider(config: ProviderConfig = {}): Provider {
  const apiKey = config.apiKey ?? process.env["OPENROUTER_API_KEY"];
  const host = trimSlash(config.host ?? process.env["OPENROUTER_HOST"] ?? DEFAULT_HOST);
  const defaultModel = config.model ?? DEFAULT_MODEL;
  const maxAttempts = config.maxAttempts ?? 2;
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    name: "openrouter",
    async generate(params: ChatParams): Promise<ChatResult> {
      if (!apiKey) throw new MissingApiKeyError("openrouter");
      const model = params.model ?? defaultModel;
      const data = await postJsonWithRetry({
        provider: "openrouter",
        url: `${host}/api/v1/chat/completions`,
        headers: { "Content-Type": "application/json", ...bearer(apiKey) },
        body: {
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
        },
        maxAttempts,
        fetchImpl,
        signal: params.signal,
        isRetriable,
        isComplete: hasChoices,
        emptyMessage: "OpenRouter response contained no choices.",
      });
      return {
        text: extractChoicesText(data),
        model,
        provider: "openrouter",
        usage: extractTokenUsage(data),
        raw: data,
      };
    },
    async listModels(): Promise<ModelInfo[]> {
      try {
        const res = await fetchImpl(`${host}/api/v1/models`, {
          headers: apiKey ? bearer(apiKey) : {},
        });
        if (res.ok) {
          const data: unknown = await res.json();
          const list = Array.isArray(data) ? data : (data as { data?: unknown }).data;
          if (Array.isArray(list)) {
            return list.map((m) => {
              const item = m as Record<string, unknown>;
              const id = typeof item["id"] === "string" ? item["id"] : "unknown";
              return {
                id,
                name: typeof item["name"] === "string" ? item["name"] : id,
              };
            });
          }
        }
      } catch {
        // fall through to static list
      }
      return [{ id: "openai/gpt-4o-mini", name: "gpt-4o-mini" }];
    },
  };
}
