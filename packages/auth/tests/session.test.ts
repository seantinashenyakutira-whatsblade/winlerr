import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exchangeCode,
  getSessionUser,
  setSessionFromTokens,
  signIn,
  signOut,
  signUp,
  type AuthPorts,
  type SupabaseAuthPort,
} from "../src/session.js";
import type { CookieStore } from "../src/cookies.js";

function makeCookies(initial: Record<string, string> = {}): CookieStore & { jar: Map<string, string> } {
  const jar = new Map(Object.entries(initial));
  return {
    jar,
    get: (name: string) => jar.get(name),
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  };
}

function makeAuth(overrides: Partial<SupabaseAuthPort> = {}): SupabaseAuthPort & { calls: string[] } {
  const calls: string[] = [];
  const fail = async (): Promise<never> => {
    throw new Error("not stubbed");
  };
  return {
    calls,
    signUp: async () => {
      calls.push("signUp");
      return await fail();
    },
    signInWithPassword: async () => {
      calls.push("signInWithPassword");
      return await fail();
    },
    signOut: async () => {
      calls.push("signOut");
      return { error: null };
    },
    setSession: async () => {
      calls.push("setSession");
      return await fail();
    },
    refreshSession: async () => {
      calls.push("refreshSession");
      return await fail();
    },
    getUser: async () => {
      calls.push("getUser");
      return await fail();
    },
    exchangeCodeForSession: async () => {
      calls.push("exchangeCodeForSession");
      return await fail();
    },
    ...overrides,
  };
}

function ports(cookies: CookieStore, auth: SupabaseAuthPort): AuthPorts {
  return { cookies, auth, isProduction: false };
}

const TOKENS = { access_token: "access-1", refresh_token: "refresh-1" };
const USER = { id: "user-1", email: "a@b.co", email_confirmed_at: "2026-01-01T00:00:00Z" };

describe("signUp", () => {
  it("persists the session when Supabase returns one", async () => {
    const cookies = makeCookies();
    const auth = makeAuth({
      signUp: async () => ({ user: USER, session: TOKENS, error: null }),
    });
    const result = await signUp(ports(cookies, auth), { email: "a@b.co", password: "s3cur3pass" });
    expect(result).toEqual({ ok: true, data: { user: { id: "user-1", email: "a@b.co", emailConfirmed: true }, sessionActive: true } });
    expect(cookies.jar.get("winlerr-sb-access")).toBe("access-1");
  });

  it("returns check-email state (not an error) when confirmation is pending", async () => {
    const cookies = makeCookies();
    const auth = makeAuth({
      signUp: async () => ({ user: USER, session: null, error: null }),
    });
    const result = await signUp(ports(cookies, auth), { email: "a@b.co", password: "s3cur3pass" });
    expect(result).toEqual({ ok: true, data: { user: { id: "user-1", email: "a@b.co", emailConfirmed: true }, sessionActive: false } });
    expect(cookies.jar.size).toBe(0);
  });

  it("maps provider errors to stable codes", async () => {
    const cookies = makeCookies();
    const auth = makeAuth({
      signUp: async () => ({ user: null, session: null, error: { message: "User already registered" } }),
    });
    const result = await signUp(ports(cookies, auth), { email: "a@b.co", password: "s3cur3pass" });
    expect(result).toEqual({ ok: false, error: "email-exists" });
  });
});

describe("signIn", () => {
  it("persists the session on success", async () => {
    const cookies = makeCookies();
    const auth = makeAuth({
      signInWithPassword: async () => ({ user: USER, session: TOKENS, error: null }),
    });
    const result = await signIn(ports(cookies, auth), { email: "a@b.co", password: "s3cur3pass" });
    expect(result.ok).toBe(true);
    expect(cookies.jar.get("winlerr-sb-refresh")).toBe("refresh-1");
  });

  it("maps bad credentials and unconfirmed email distinctly", async () => {
    const bad = makeAuth({
      signInWithPassword: async () => ({ user: null, session: null, error: { message: "Invalid login credentials" } }),
    });
    expect(await signIn(ports(makeCookies(), bad), { email: "a@b.co", password: "wrongwrong" })).toEqual({
      ok: false,
      error: "invalid-credentials",
    });
    const unconfirmed = makeAuth({
      signInWithPassword: async () => ({ user: null, session: null, error: { message: "Email not confirmed" } }),
    });
    expect(await signIn(ports(makeCookies(), unconfirmed), { email: "a@b.co", password: "s3cur3pass" })).toEqual({
      ok: false,
      error: "email-not-confirmed",
    });
  });
});

describe("signOut", () => {
  it("clears cookies even when the provider call fails", async () => {
    const cookies = makeCookies({ "winlerr-sb-access": "a", "winlerr-sb-refresh": "r" });
    const auth = makeAuth({
      signOut: async () => {
        throw new Error("boom");
      },
    });
    await signOut(ports(cookies, auth));
    expect(cookies.jar.size).toBe(0);
  });
});

describe("getSessionUser", () => {
  it("returns null without contacting the provider when cookies are missing", async () => {
    const auth = makeAuth();
    expect(await getSessionUser(ports(makeCookies(), auth))).toBeNull();
    expect(auth.calls).toEqual([]);
  });

  it("validates the access token server-side", async () => {
    const cookies = makeCookies({ "winlerr-sb-access": "a", "winlerr-sb-refresh": "r" });
    const auth = makeAuth({
      getUser: async () => ({ user: USER, error: null }),
    });
    expect(await getSessionUser(ports(cookies, auth))).toEqual({
      id: "user-1",
      email: "a@b.co",
      emailConfirmed: true,
    });
  });

  it("refreshes once on an expired token, then clears stale cookies on failure", async () => {
    const cookies = makeCookies({ "winlerr-sb-access": "old", "winlerr-sb-refresh": "r" });
    const auth = makeAuth({
      getUser: async () => ({ user: null, error: { message: "expired" } }),
      refreshSession: async () => ({ user: USER, session: TOKENS, error: null }),
    });
    expect(await getSessionUser(ports(cookies, auth))).toEqual({
      id: "user-1",
      email: "a@b.co",
      emailConfirmed: true,
    });
    expect(cookies.jar.get("winlerr-sb-access")).toBe("access-1");

    const stale = makeCookies({ "winlerr-sb-access": "old", "winlerr-sb-refresh": "bad" });
    const failing = makeAuth({
      getUser: async () => ({ user: null, error: { message: "expired" } }),
      refreshSession: async () => ({ user: null, session: null, error: { message: "refresh token not found" } }),
    });
    expect(await getSessionUser(ports(stale, failing))).toBeNull();
    expect(stale.jar.size).toBe(0);
  });
});

describe("setSessionFromTokens", () => {
  it("rejects empty tokens without a provider call", async () => {
    const auth = makeAuth();
    const result = await setSessionFromTokens(ports(makeCookies(), auth), { access_token: "", refresh_token: "" });
    expect(result).toEqual({ ok: false, error: "session-missing" });
    expect(auth.calls).toEqual([]);
  });
});

describe("exchangeCode", () => {
  it("persists the exchanged session", async () => {
    const cookies = makeCookies();
    const auth = makeAuth({
      exchangeCodeForSession: async () => ({ user: USER, session: TOKENS, error: null }),
    });
    const result = await exchangeCode(ports(cookies, auth), "pkce-code");
    expect(result.ok).toBe(true);
    expect(cookies.jar.get("winlerr-sb-access")).toBe("access-1");
  });
});

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});
