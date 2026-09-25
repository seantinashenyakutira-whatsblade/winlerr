/**
 * Shared fetch transport for providers.
 *
 * Retry + extraction semantics adapted from wanie
 * (MIT License, Copyright (c) 2026 asepindrak,
 * https://github.com/asepindrak/wanie — server/ai/llm-adapters/):
 * bounded attempts, linear backoff, retry on 5xx or empty payloads.
 * Rewritten in strict TypeScript with typed errors and secret redaction.
 */
import { EmptyResponseError, ProviderRequestError } from "../errors.js";

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function trimSlash(host: string): string {
  return host.replace(/\/$/, "");
}

export function bearer(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}

export interface PostJsonOptions {
  provider: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  maxAttempts: number;
  fetchImpl: typeof fetch;
  signal?: AbortSignal;
  /** True when the failure is worth retrying (5xx / empty / overloaded). */
  isRetriable: (status: number | undefined, bodyText: string, data: unknown) => boolean;
  /** True when the parsed payload is usable. */
  isComplete: (data: unknown) => boolean;
  emptyMessage: string;
}

/** POST JSON with bounded retries. Throws typed errors, never raw secrets. */
export async function postJsonWithRetry(options: PostJsonOptions): Promise<unknown> {
  const { provider, url, headers, body, maxAttempts, fetchImpl, signal, isRetriable, isComplete, emptyMessage } =
    options;
  const attempts = Math.max(1, maxAttempts);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let res: Response;
    try {
      res = await fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < attempts) {
        await delay(250 * attempt);
        continue;
      }
      throw new ProviderRequestError(provider, undefined, lastError.message);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      lastError = new Error(`${res.status} ${text}`);
      if (attempt < attempts && isRetriable(res.status, text, null)) {
        await delay(250 * attempt);
        continue;
      }
      throw new ProviderRequestError(provider, res.status, text);
    }

    const data: unknown = await res.json().catch(() => null);
    if (!isComplete(data)) {
      lastError = new Error(emptyMessage);
      if (attempt < attempts) {
        await delay(250 * attempt);
        continue;
      }
      throw new EmptyResponseError(provider);
    }
    return data;
  }

  throw lastError instanceof Error ? lastError : new ProviderRequestError(provider, undefined, emptyMessage);
}

export function hasChoices(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const choices = (data as { choices?: unknown }).choices;
  return Array.isArray(choices) && choices.length > 0;
}

/** Extract assistant text from an OpenAI-compatible choices payload. */
export function extractChoicesText(data: unknown): string {
  if (!hasChoices(data)) return "";
  const choice = (data as { choices: Array<{ message?: unknown; text?: unknown }> }).choices[0];
  const message = choice.message;
  if (typeof message === "string") return message;
  if (typeof message === "object" && message !== null) {
    const content = (message as { content?: unknown }).content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null && typeof (item as { text?: unknown }).text === "string") {
            return (item as { text: string }).text;
          }
          return "";
        })
        .join("")
        .trim();
    }
  }
  return typeof choice.text === "string" ? choice.text : "";
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Map an OpenAI-compatible `usage` block; zeros when absent. */
export function extractTokenUsage(data: unknown): TokenUsage {
  if (typeof data !== "object" || data === null) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
  const usage = (data as { usage?: unknown }).usage;
  if (typeof usage !== "object" || usage === null) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
  const u = usage as Record<string, unknown>;
  const prompt = typeof u["prompt_tokens"] === "number" ? u["prompt_tokens"] : 0;
  const completion = typeof u["completion_tokens"] === "number" ? u["completion_tokens"] : 0;
  const total = typeof u["total_tokens"] === "number" ? u["total_tokens"] : prompt + completion;
  return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
}
