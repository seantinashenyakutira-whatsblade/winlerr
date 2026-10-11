import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  mapAuthError,
} from "../src/errors.js";

describe("mapAuthError", () => {
  it("maps known provider messages to stable codes", () => {
    expect(mapAuthError("Invalid login credentials")).toBe("invalid-credentials");
    expect(mapAuthError("Email not confirmed")).toBe("email-not-confirmed");
    expect(mapAuthError("User already registered")).toBe("email-exists");
    expect(mapAuthError("Password should be at least 8 characters")).toBe("weak-password");
    expect(mapAuthError("refresh token not found")).toBe("session-expired");
    expect(mapAuthError("fetch failed")).toBe("network");
  });

  it("falls back safely for unknown or empty messages", () => {
    expect(mapAuthError("Something exotic happened")).toBe("provider");
    expect(mapAuthError(null)).toBe("unknown");
    expect(mapAuthError(undefined)).toBe("unknown");
  });
});

describe("credentialsSchema", () => {
  it("accepts valid credentials", () => {
    const parsed = credentialsSchema.safeParse({ email: "a@b.co", password: "s3cur3pass" });
    expect(parsed.success).toBe(true);
  });

  it("rejects bad email and short passwords", () => {
    expect(credentialsSchema.safeParse({ email: "nope", password: "s3cur3pass" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
  });
});
