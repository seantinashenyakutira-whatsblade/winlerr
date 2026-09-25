import { describe, expect, it, vi } from "vitest";
import { EmptyResponseError, MissingApiKeyError } from "../src/errors.js";
import { createAnthropicProvider } from "../src/providers/anthropic.js";
import { createOllamaProvider } from "../src/providers/ollama.js";
import { createOpenAIProvider } from "../src/providers/openai.js";
import { createOpenRouterProvider } from "../src/providers/openrouter.js";

interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

function mockFetch(handler: (url: string) => MockResponse) {
  return vi.fn(async (input: string | URL | Request) => handler(String(input)) as unknown as Response);
}

function jsonResponse(payload: unknown, status = 200): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

describe("openrouter provider", () => {
  it("returns text with mapped token usage", async () => {
    const fetchImpl = mockFetch(() =>
      jsonResponse({
        choices: [{ message: { content: "hello back" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    );
    const provider = createOpenRouterProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.generate({ messages: [{ role: "user", content: "hi" }] });
    expect(result.text).toBe("hello back");
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
    expect(result.provider).toBe("openrouter");
  });

  it("retries once on 500 then succeeds", async () => {
    let calls = 0;
    const fetchImpl = mockFetch(() => {
      calls += 1;
      if (calls === 1) return jsonResponse({ error: "boom" }, 500);
      return jsonResponse({ choices: [{ message: { content: "recovered" } }] });
    });
    const provider = createOpenRouterProvider({ apiKey: "k", fetchImpl, maxAttempts: 2 });
    const result = await provider.generate({ messages: [{ role: "user", content: "hi" }] });
    expect(result.text).toBe("recovered");
    expect(calls).toBe(2);
  });

  it("throws MissingApiKeyError without a key", async () => {
    const provider = createOpenRouterProvider({ apiKey: undefined, fetchImpl: mockFetch(() => jsonResponse({})) });
    await expect(provider.generate({ messages: [{ role: "user", content: "hi" }] })).rejects.toBeInstanceOf(
      MissingApiKeyError,
    );
  });

  it("throws EmptyResponseError on choiceless payload", async () => {
    const fetchImpl = mockFetch(() => jsonResponse({ choices: [] }));
    const provider = createOpenRouterProvider({ apiKey: "k", fetchImpl, maxAttempts: 1 });
    await expect(provider.generate({ messages: [{ role: "user", content: "hi" }] })).rejects.toBeInstanceOf(
      EmptyResponseError,
    );
  });
});

describe("openai provider", () => {
  it("posts to the chat completions endpoint", async () => {
    const seen: string[] = [];
    const fetchImpl = mockFetch((url) => {
      seen.push(url);
      return jsonResponse({ choices: [{ message: { content: "done" } }] });
    });
    const provider = createOpenAIProvider({ apiKey: "k", fetchImpl });
    const result = await provider.generate({ messages: [{ role: "user", content: "hi" }] });
    expect(seen[0]).toBe("https://api.openai.com/v1/chat/completions");
    expect(result.text).toBe("done");
  });
});

describe("anthropic provider", () => {
  it("uses the Messages API with version header and maps usage", async () => {
    const seen: Array<{ url: string; init: { headers: Record<string, string>; body: string } }> = [];
    const fetchImpl = mockFetch((_url) => {
      return jsonResponse({
        content: [{ type: "text", text: "claude says hi" }],
        usage: { input_tokens: 8, output_tokens: 4 },
      });
    });
    const wrapped = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const headers = ((init?.headers ?? {}) as Record<string, string>);
      const body = typeof init?.body === "string" ? init.body : "";
      seen.push({ url: String(input), init: { headers, body } });
      return fetchImpl(String(input)) as unknown as Response;
    });
    const provider = createAnthropicProvider({ apiKey: "k", fetchImpl: wrapped });
    const result = await provider.generate({
      messages: [
        { role: "system", content: "be brief" },
        { role: "user", content: "hi" },
      ],
    });
    expect(seen[0].url).toBe("https://api.anthropic.com/v1/messages");
    expect(seen[0].init.headers["anthropic-version"]).toBe("2023-06-01");
    expect(result.text).toBe("claude says hi");
    expect(result.usage).toEqual({ promptTokens: 8, completionTokens: 4, totalTokens: 12 });
  });
});

describe("ollama provider", () => {
  it("needs no key and returns local text", async () => {
    const fetchImpl = mockFetch(() => jsonResponse({ response: "local answer" }));
    const provider = createOllamaProvider({ fetchImpl });
    const result = await provider.generate({
      messages: [{ role: "user", content: "hi" }],
      model: "llama2",
    });
    expect(result.text).toBe("local answer");
    expect(result.usage.totalTokens).toBe(0);
  });

  it("rejects a missing model", async () => {
    const provider = createOllamaProvider({ fetchImpl: mockFetch(() => jsonResponse({})) });
    await expect(provider.generate({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(
      /model is required/,
    );
  });
});
