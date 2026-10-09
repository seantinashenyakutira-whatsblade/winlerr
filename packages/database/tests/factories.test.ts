/**
 * Factory unit tests. No network I/O: `createClient` is lazy and performs
 * no requests on construction, so these tests only exercise env validation
 * and client shape.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBrowserClient } from "../src/browser.js";
import {
  createServerClient,
  createServiceRoleClient,
} from "../src/server.js";

const URL = "https://example.supabase.co";
const ANON_KEY = "anon-key";
const SERVICE_KEY = "service-role-key";

const MANAGED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const name of MANAGED) {
    saved[name] = process.env[name];
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of MANAGED) {
    if (saved[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = saved[name];
    }
  }
});

describe("createServerClient", () => {
  it("throws naming the URL variable when env is empty", () => {
    expect(() => createServerClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("throws naming the anon key when only the URL is set", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = URL;
    expect(() => createServerClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("returns a usable query client when env is set", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = URL;
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = ANON_KEY;
    const client = createServerClient();
    expect(typeof client.from).toBe("function");
    expect(typeof client.from("leads").insert).toBe("function");
  });
});

describe("createServiceRoleClient", () => {
  it("throws naming the service-role variable when the key is missing", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = URL;
    expect(() => createServiceRoleClient()).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("returns a usable query client when the key is set", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = URL;
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = SERVICE_KEY;
    const client = createServiceRoleClient();
    expect(typeof client.from).toBe("function");
    expect(typeof client.from("admin_profiles").select).toBe("function");
  });
});

describe("createBrowserClient", () => {
  it("throws when env is empty", () => {
    expect(() => createBrowserClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("returns a usable query client when env is set", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = URL;
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = ANON_KEY;
    const client = createBrowserClient();
    expect(typeof client.from).toBe("function");
  });

  it("never requires the service-role key", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = URL;
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = ANON_KEY;
    expect(saved["SUPABASE_SERVICE_ROLE_KEY"]).toBeUndefined();
    expect(() => createBrowserClient()).not.toThrow();
  });
});
