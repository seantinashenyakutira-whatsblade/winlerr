/**
 * Anthropic provider — Messages API.
 *
 * Ported from wanie (MIT License, Copyright (c) 2026 asepindrak,
 * https://github.com/asepindrak/wanie — server/ai/llm-adapters/anthropic.js):
 * retry-on-5xx-or-empty semantics preserved. Transport modernized:
 * wanie targets the retired legacy `/v1/complete` Completions API with
 * `claude-2` defaults; this port uses the current `/v1/messages` API
 * with `anthropic-version: 2023-06-01` and maps real token usage
 * (`input_tokens` / `output_tokens`). No SDK dependency — plain fetch.
 */
import { MissingApiKeyError } from "../errors.js";
import type { ChatParams, ChatResult, Message, ModelInfo, Provider, ProviderConfig } from "../types.js";
import { postJsonWithRetry, trimSlash } from "./base.js";

const DEFAULT_HOST = "https://api.anthropic.com";
const DEFAULT_MODEL = "claude-3-5-haiku-20241022";
const ANTHROPIC_VERSION = "2023-06-01";

function isRetriable(status: number | undefined, bodyText: string, data: unknown): boolean {
  if (status !== undefined && status >= 500) return true;
  if (data !== null && !hasAnthropicText(data)) return true;
  return /overloaded|server_error/i.test(bodyText);
}

function hasAnthropicText(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const content = (data as { content?: unknown }).content;
  if (typeof content === "string") return content.length > 0;
  return Array.isArray(content) && content.length > 0;
}

function toAnthropicMessages(messages: Message[]): { system?: string; messages: Array<{ role: string; content: string }> } {
  const systemParts: string[] = [];
  const rest: Array<{ role: string; content: string }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else if (m.role === "tool") {
      rest.push({ role: "user", content: m.content });
    } else {
      rest.push({ role: m.role, content: m.content });
    }
  }
  return systemParts.length > 0
    ? { system: systemParts.join("\n"), messages: rest }
    : { messages: rest };
}

function extractText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const content = (data as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "object" && block !== null && typeof (block as { text?: unknown }).text === "string") {
          return (block as { text: string }).text;
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

function extractUsage(data: unknown): { promptTokens: number; completionTokens: number; totalTokens: number } {
  if (typeof data !== "object" || data === null) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
  const usage = (data as { usage?: unknown }).usage;
  if (typeof usage !== "object" || usage === null) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
  const u = usage as Record<string, unknown>;
  const prompt = typeof u["input_tokens"] === "number" ? u["input_tokens"] : 0;
  const completion = typeof u["output_tokens"] === "number" ? u["output_tokens"] : 0;
  return { promptTokens: prompt, completionTokens: completion, totalTokens: prompt + completion };
}

export function createAnthropicProvider(config: ProviderConfig = {}): Provider {
  const apiKey = config.apiKey ?? process.env["ANTHROPIC_API_KEY"];
  const host = trimSlash(config.host ?? process.env["ANTHROPIC_HOST"] ?? DEFAULT_HOST);
  const defaultModel = config.model ?? DEFAULT_MODEL;
  const maxAttempts = config.maxAttempts ?? 2;
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    name: "anthropic",
    async generate(params: ChatParams): Promise<ChatResult> {
      if (!apiKey) throw new MissingApiKeyError("anthropic");
      const model = params.model ?? defaultModel;
      const { system, messages } = toAnthropicMessages(params.messages);
      const data = await postJsonWithRetry({
        provider: "anthropic",
        url: `${host}/v1/messages`,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: {
          model,
          max_tokens: params.maxTokens ?? 1024,
          ...(system !== undefined ? { system } : {}),
          messages,
          ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        },
        maxAttempts,
        fetchImpl,
        signal: params.signal,
        isRetriable,
        isComplete: hasAnthropicText,
        emptyMessage: "Anthropic response contained no content.",
      });
      return {
        text: extractText(data),
        model,
        provider: "anthropic",
        usage: extractUsage(data),
        raw: data,
      };
    },
    async listModels(): Promise<ModelInfo[]> {
      return [{ id: "claude-3-5-haiku-20241022", name: "claude-3-5-haiku" }];
    },
  };
}
