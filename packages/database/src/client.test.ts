import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminClient, createBrowserClient, createServerClient } from "./client.js";

const cfg = {
  supabaseUrl: "https://example.supabase.co",
  supabaseKey: "anon-key",
};

const adminCfg = {
  supabaseUrl: "https://example.supabase.co",
  supabaseKey: "service-role-key",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("database/client", () => {
  it("creates a browser client without bypassing RLS", () => {
    const client = createBrowserClient(cfg);
    expect(client.bypassRls).toBe(false);
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth.getSession).toBe("function");
  });

  it("creates a server client without bypassing RLS", () => {
    const client = createServerClient(cfg);
    expect(client.bypassRls).toBe(false);
  });

  it("creates an admin client that bypasses RLS on the server", () => {
    const client = createAdminClient(adminCfg);
    expect(client.bypassRls).toBe(true);
  });

  it("rejects missing or malformed configuration", () => {
    expect(() => createBrowserClient({ supabaseUrl: "", supabaseKey: "" })).toThrow(/required/);
    expect(() => createServerClient({ supabaseUrl: "not-a-url", supabaseKey: "k" })).toThrow(
      /valid URL/
    );
  });

  it("executes a typed foundation query through the real SDK adapter", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    globalThis.fetch = fetchMock;

    const client = createServerClient(cfg);
    const result = await client.from("organizations").select("id");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/rest/v1/organizations");
  });

  it("adds a request access token only to a non-admin server client", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    globalThis.fetch = fetchMock;

    const client = createServerClient({ ...cfg, accessToken: "token-in-memory" });
    await client.from("organizations").select("id");

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = new Headers(request?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-in-memory");
  });

  it("protects the admin factory from client execution", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    try {
      expect(() => createAdminClient(adminCfg)).toThrow(/must not be called/);
    } finally {
      if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      }
    }
  });
});
