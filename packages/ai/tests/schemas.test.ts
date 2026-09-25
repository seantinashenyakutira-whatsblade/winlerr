import { describe, expect, it } from "vitest";
import { ChatParamsSchema, MessageSchema, UsageSchema } from "../src/schemas.js";

describe("MessageSchema", () => {
  it("accepts a valid user message", () => {
    const parsed = MessageSchema.parse({ role: "user", content: "hello" });
    expect(parsed.role).toBe("user");
  });

  it("rejects an unknown role", () => {
    expect(() => MessageSchema.parse({ role: "robot", content: "hi" })).toThrow();
  });

  it("rejects a missing content field", () => {
    expect(() => MessageSchema.parse({ role: "user" })).toThrow();
  });
});

describe("ChatParamsSchema", () => {
  it("accepts messages with optional tuning fields", () => {
    const parsed = ChatParamsSchema.parse({
      messages: [{ role: "user", content: "hi" }],
      temperature: 0.5,
      maxTokens: 128,
    });
    expect(parsed.messages).toHaveLength(1);
  });

  it("rejects an empty messages array", () => {
    expect(() => ChatParamsSchema.parse({ messages: [] })).toThrow();
  });

  it("rejects out-of-range temperature", () => {
    expect(() =>
      ChatParamsSchema.parse({ messages: [{ role: "user", content: "hi" }], temperature: 5 }),
    ).toThrow();
  });
});

describe("UsageSchema", () => {
  it("rejects negative token counts", () => {
    expect(() =>
      UsageSchema.parse({ promptTokens: -1, completionTokens: 0, totalTokens: 0 }),
    ).toThrow();
  });
});
