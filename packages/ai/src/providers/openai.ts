/**
 * OpenAI provider — chat completions.
 *
 * Ported from wanie (MIT License, Copyright (c) 2026 asepindrak,
 * https://github.com/asepindrak/wanie — server/ai/llm-adapters/openai.js):
 * retry-on-5xx-or-empty-choices and extraction preserved; legacy
 * `/v1/completions` and transcription paths intentionally omitted
 * (chat-only contract). Default model modernized from the retired
 * `gpt-3.5-turbo` to `gpt-4o-mini`. No SDK dependency — plain fetch.
 */
import { MissingApiKeyError } from "../errors.js";
import type { ChatParams, ChatResult, ModelInfo, Provider, ProviderConfig } from "../types.js";
import { bearer, extractChoicesText, extractTokenUsage, hasChoices, postJsonWithRetry, trimSlash } from "./base.js";

const DEFAULT_HOST = "https://api.openai.com";
const DEFAULT_MODEL = "gpt-4o-mini";

function isRetriable(status: number | undefined, bodyText: string, data: unknown): boolean {
  if (status !== undefined && status >= 500) return true;
  if (data !== null && !hasChoices(data)) return true;
  return /response contained no choices/i.test(bodyText);
}

export function createOpenAIProvider(config: ProviderConfig = {}): Provider {
  const apiKey = config.apiKey ?? process.env["OPENAI_API_KEY"];
  const host = trimSlash(config.host ?? process.env["OPENAI_HOST"] ?? DEFAULT_HOST);
  const defaultModel = config.model ?? DEFAULT_MODEL;
  const maxAttempts = config.maxAttempts ?? 2;
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    name: "openai",
    async generate(params: ChatParams): Promise<ChatResult> {
      if (!apiKey) throw new MissingApiKeyError("openai");
      const model = params.model ?? defaultModel;
      const data = await postJsonWithRetry({
        provider: "openai",
        url: `${host}/v1/chat/completions`,
        headers: { "Content-Type": "application/json", ...bearer(apiKey) },
        body: {
          model,
          messages: params.messages,
          ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
          ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        },
        maxAttempts,
        fetchImpl,
        signal: params.signal,
        isRetriable,
        isComplete: hasChoices,
        emptyMessage: "OpenAI response contained no choices.",
      });
      return {
        text: extractChoicesText(data),
        model,
        provider: "openai",
        usage: extractTokenUsage(data),
        raw: data,
      };
    },
    async listModels(): Promise<ModelInfo[]> {
      try {
        const res = await fetchImpl(`${host}/v1/models`, { headers: apiKey ? bearer(apiKey) : {} });
        if (res.ok) {
          const data: unknown = await res.json();
          const list = (data as { data?: unknown }).data;
          if (Array.isArray(list)) {
            return list.map((m) => {
              const id = (m as { id?: unknown }).id;
              return { id: typeof id === "string" ? id : "unknown", name: typeof id === "string" ? id : "unknown" };
            });
          }
        }
      } catch {
        // fall through to static list
      }
      return [{ id: "gpt-4o-mini", name: "gpt-4o-mini" }];
    },
  };
}
