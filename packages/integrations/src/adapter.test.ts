import { describe, it, expect } from "vitest";
import { createExampleAdapter } from "./adapter.js";

describe("integrations/adapter contract", () => {
  it("validates config", () => {
    const adapter = createExampleAdapter("whatsapp");
    expect(adapter.validateConfig({ apiKey: "key" }).valid).toBe(true);
    expect(adapter.validateConfig({ apiKey: "" }).valid).toBe(false);
  });

  it("executes with valid config and returns success without external call", async () => {
    const adapter = createExampleAdapter("email");
    const result = await adapter.execute(
      { apiKey: "key" },
      { to: "a@b.com", message: "hi", organizationId: "org1" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.externalId).toMatch(/^mock-/);
      expect(result.data.status).toBe("queued");
    }
  });

  it("fails when organizationId missing", async () => {
    const adapter = createExampleAdapter("whatsapp");
    const result = await adapter.execute(
      { apiKey: "key" },
      { to: "123", message: "hi", organizationId: "" }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.provider).toBe("whatsapp");
    }
  });

  it("fails when config invalid", async () => {
    const adapter = createExampleAdapter("calendar");
    const result = await adapter.execute(
      { apiKey: "" },
      { to: "x", message: "hi", organizationId: "org1" }
    );
    expect(result.ok).toBe(false);
  });

  it("adapter has provider", () => {
    const adapter = createExampleAdapter("payments");
    expect(adapter.provider).toBe("payments");
  });
});
