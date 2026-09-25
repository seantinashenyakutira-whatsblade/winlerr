/**
 * Ollama provider — local models via the Ollama HTTP API.
 *
 * Ported from wanie (MIT License, Copyright (c) 2026 asepindrak,
 * https://github.com/asepindrak/wanie — server/ai/llm-adapters/ollama.js):
 * message-join prompt construction and optional `/api/models`
 * discovery preserved. No API key required. No SDK dependency.
 */
import { AiError, ProviderRequestError } from "../errors.js";
import type { ChatParams, ChatResult, ModelInfo, Provider, ProviderConfig } from "../types.js";
import { trimSlash } from "./base.js";

const DEFAULT_HOST = "http://localhost:11434";

export function createOllamaProvider(config: ProviderConfig = {}): Provider {
  const host = trimSlash(config.host ?? process.env["OLLAMA_HOST"] ?? DEFAULT_HOST);
  const defaultModel = config.model;
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    name: "ollama",
    async generate(params: ChatParams): Promise<ChatResult> {
      const model = params.model ?? defaultModel;
      if (!model) {
        throw new AiError("AI_INVALID_PARAMS", "ollama: model is required (config.model or params.model).");
      }
      const prompt = params.messages.map((m) => m.content).join("\n");
      const res = await fetchImpl(`${host}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
          stream: false,
        }),
        signal: params.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new ProviderRequestError("ollama", res.status, text);
      }
      const data: unknown = await res.json().catch(() => null);
      const text =
        typeof data === "object" && data !== null && typeof (data as { response?: unknown }).response === "string"
          ? ((data as { response: string }).response as string)
          : "";
      // Local models report no billing usage; zeros keep metering consistent.
      return {
        text,
        model,
        provider: "ollama",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        raw: data,
      };
    },
    async listModels(): Promise<ModelInfo[]> {
      try {
        const res = await fetchImpl(`${host}/api/models`);
        if (res.ok) {
          const data: unknown = await res.json();
          if (Array.isArray(data)) {
            return data.map((m) => {
              const item = m as Record<string, unknown>;
              const id = typeof item["name"] === "string" ? item["name"] : "unknown";
              return { id, name: id };
            });
          }
        }
      } catch {
        // fall through to static list
      }
      return [
        { id: "llama2", name: "llama2" },
        { id: "mistral", name: "mistral" },
      ];
    },
  };
}
