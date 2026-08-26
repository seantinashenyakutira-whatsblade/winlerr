import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createAiClient } from "./client.js";

describe("ai/client contract", () => {
  it("validates correct request", () => {
    const client = createAiClient();
    const result = client.validate({
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects empty messages", () => {
    const client = createAiClient();
    const result = client.validate({ messages: [] } as never);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/messages/);
  });

  it("validates tools have schema", () => {
    const client = createAiClient();
    const tool = {
      name: "search",
      description: "search",
      schema: z.object({ query: z.string() }),
    };
    const result = client.validate({
      messages: [{ role: "user", content: "hi" }],
      tools: [tool],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects tool missing fields", () => {
    const client = createAiClient();
    const result = client.validate({
      messages: [{ role: "user", content: "hi" }],
      tools: [{ name: "", description: "", schema: null } as never],
    });
    expect(result.valid).toBe(false);
  });

  it("chat throws not implemented (placeholder)", async () => {
    const client = createAiClient();
    await expect(
      client.chat({ messages: [{ role: "user", content: "hi" }] })
    ).rejects.toThrow(/not wired/);
  });

  it("supports structured output schema", () => {
    const client = createAiClient();
    const schema = z.object({ answer: z.string() });
    const result = client.validate({
      messages: [{ role: "user", content: "hi" }],
      responseSchema: schema,
    });
    expect(result.valid).toBe(true);
  });
});
