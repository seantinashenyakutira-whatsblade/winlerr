import { describe, it, expect } from "vitest";
import {
  createBrowserClient,
  createServerClient,
  createAdminClient,
} from "./client.js";

const cfg = {
  supabaseUrl: "https://example.supabase.co",
  supabaseKey: "anon-key",
};

const adminCfg = {
  supabaseUrl: "https://example.supabase.co",
  supabaseKey: "service-role-key",
};

describe("database/client", () => {
  it("creates browser client without bypassing RLS", () => {
    const client = createBrowserClient(cfg);
    expect(client.bypassRls).toBe(false);
    expect(typeof client.from).toBe("function");
  });

  it("creates server client on server", () => {
    const client = createServerClient(cfg);
    expect(client.bypassRls).toBe(false);
  });

  it("creates admin client that bypasses RLS on server", () => {
    const client = createAdminClient(adminCfg);
    expect(client.bypassRls).toBe(true);
  });

  it("throws if config missing", () => {
    expect(() =>
      createBrowserClient({ supabaseUrl: "", supabaseKey: "" })
    ).toThrow(/required/);
    expect(() =>
      createServerClient({ supabaseUrl: "", supabaseKey: "k" })
    ).toThrow(/required/);
  });

  it("placeholder from() throws when queried (not yet wired)", async () => {
    const client = createBrowserClient(cfg);
    await expect(client.from("test").select()).rejects.toThrow(/placeholder/);
  });

  it("from returns query builder shape", () => {
    const client = createBrowserClient(cfg);
    const builder = client.from("organizations");
    expect(typeof builder.select).toBe("function");
    expect(typeof builder.insert).toBe("function");
    expect(typeof builder.update).toBe("function");
    expect(typeof builder.delete).toBe("function");
  });
});
