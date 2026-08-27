import { describe, it, expect } from "vitest";
import {
  parsePublicEnv,
  parseServerEnv,
  redactConfig,
  isServer,
  requireSupabasePublicConfig,
  requireSupabaseServerConfig,
} from "./env.js";

describe("config/env", () => {
  it("parses valid public env", () => {
    const parsed = parsePublicEnv({
      NEXT_PUBLIC_APP_URL: "https://winlerr.vip",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NODE_ENV: "development",
    });
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("https://winlerr.vip");
    expect(parsed.NODE_ENV).toBe("development");
  });

  it("defaults NODE_ENV", () => {
    const parsed = parsePublicEnv({});
    expect(parsed.NODE_ENV).toBe("development");
  });

  it("allows empty optional vars during placeholder development", () => {
    const parsed = parseServerEnv({});
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(parsed.OPENAI_API_KEY).toBeUndefined();
  });

  it("requires public Supabase runtime values", () => {
    expect(() => requireSupabasePublicConfig(parsePublicEnv({}))).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY/
    );
    expect(
      requireSupabasePublicConfig(
        parsePublicEnv({
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "publishable-key",
        })
      )
    ).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "publishable-key",
    });
  });

  it("requires server-only service-role configuration separately", () => {
    const publicConfig = parseServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "publishable-key",
    });
    expect(() => requireSupabaseServerConfig(publicConfig)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(
      requireSupabaseServerConfig({
        ...publicConfig,
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      })
    ).toMatchObject({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "publishable-key",
      serviceRoleKey: "service-role-key",
    });
  });

  it("rejects invalid URL", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_APP_URL: "not-a-url" })).toThrow();
  });

  it("parses server env with secrets", () => {
    const parsed = parseServerEnv({
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      OPENAI_API_KEY: "sk-test",
    });
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role");
    expect(parsed.OPENAI_API_KEY).toBe("sk-test");
  });

  it("redacts secrets for logging", () => {
    const redacted = redactConfig({
      NEXT_PUBLIC_APP_URL: "https://winlerr.vip",
      SUPABASE_SERVICE_ROLE_KEY: "secret123",
      OPENAI_API_KEY: "sk-123",
      NODE_ENV: "test",
      DATABASE_URL: "postgres://...",
    });
    expect(redacted.NEXT_PUBLIC_APP_URL).toBe("https://winlerr.vip");
    expect(redacted.SUPABASE_SERVICE_ROLE_KEY).toBe("[REDACTED]");
    expect(redacted.OPENAI_API_KEY).toBe("[REDACTED]");
    expect(redacted.DATABASE_URL).toBe("[REDACTED]");
    expect(redacted.NODE_ENV).toBe("test");
  });

  it("handles empty secrets as [EMPTY]", () => {
    const redacted = redactConfig({ OPENAI_API_KEY: "" });
    expect(redacted.OPENAI_API_KEY).toBe("[EMPTY]");
  });

  it("isServer returns true in node", () => {
    expect(isServer()).toBe(true);
  });
});
