import { describe, expect, it } from "vitest";
import { AiError, ProviderRequestError, redactSecrets } from "../src/errors.js";

describe("AiError", () => {
  it("carries a stable code", () => {
    const error = new AiError("AI_ABORTED", "stopped");
    expect(error.code).toBe("AI_ABORTED");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("ProviderRequestError", () => {
  it("redacts embedded secrets from messages", () => {
    const error = new ProviderRequestError("openai", 401, "bad key sk-abcdef1234567890 here");
    expect(error.message).not.toContain("sk-abcdef1234567890");
    expect(error.message).toContain("[REDACTED]");
    expect(error.status).toBe(401);
  });
});

describe("redactSecrets", () => {
  it("redacts bearer tokens and api-key fields", () => {
    expect(redactSecrets("Authorization: Bearer abcdefgh12345678")).toBe("Authorization: Bearer [REDACTED]");
    expect(redactSecrets('{"apiKey": "supersecretvalue"}')).toBe('{"apiKey": "[REDACTED]"}');
  });

  it("leaves plain text untouched", () => {
    expect(redactSecrets("nothing sensitive here")).toBe("nothing sensitive here");
  });
});
