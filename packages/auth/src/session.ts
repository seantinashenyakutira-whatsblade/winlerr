/**
 * @winlerr/auth — session lifecycle against injected ports.
 *
 * All Supabase + cookie I/O flows through the `AuthPorts` interfaces so
 * this module is fully unit-testable with fakes (no network, no Next.js).
 * Fail-closed throughout: any ambiguity resolves to signed-out.
 */

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  type CookieStore,
} from "./cookies.js";
import { mapAuthError } from "./errors.js";
import type { AuthErrorCode, AuthResult, AuthUser } from "./types.js";

export interface SupabaseAuthPort {
  signUp(args: {
    email: string;
    password: string;
    emailRedirectTo?: string;
  }): Promise<{ user: { id: string; email?: string | null } | null; session: { access_token: string; refresh_token: string } | null; error: { message: string } | null }>;
  signInWithPassword(args: {
    email: string;
    password: string;
  }): Promise<{ user: { id: string; email?: string | null } | null; session: { access_token: string; refresh_token: string } | null; error: { message: string } | null }>;
  signOut(): Promise<{ error: { message: string } | null }>;
  setSession(args: {
    access_token: string;
    refresh_token: string;
  }): Promise<{ user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null; error: { message: string } | null }>;
  refreshSession(args: {
    refresh_token: string;
  }): Promise<{ user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null; session: { access_token: string; refresh_token: string } | null; error: { message: string } | null }>;
  getUser(accessToken: string): Promise<{ user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null; error: { message: string } | null }>;
  exchangeCodeForSession(code: string): Promise<{ user: { id: string; email?: string | null } | null; session: { access_token: string; refresh_token: string } | null; error: { message: string } | null }>;
}

export interface AuthPorts {
  cookies: CookieStore;
  auth: SupabaseAuthPort;
  isProduction: boolean;
}

function toAuthUser(raw: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
} | null): AuthUser | null {
  if (!raw) return null;
  return {
    id: raw.id,
    email: raw.email ?? null,
    emailConfirmed: raw.email_confirmed_at != null,
  };
}

function persistSession(ports: AuthPorts, accessToken: string, refreshToken: string): void {
  const options = cookieOptions(ports.isProduction);
  ports.cookies.set(ACCESS_COOKIE, accessToken, options);
  ports.cookies.set(REFRESH_COOKIE, refreshToken, options);
}

function clearSession(ports: AuthPorts): void {
  ports.cookies.delete(ACCESS_COOKIE);
  ports.cookies.delete(REFRESH_COOKIE);
}

export interface SignUpInput {
  email: string;
  password: string;
  emailRedirectTo?: string;
}

export type SignUpOutcome =
  | { ok: true; data: { user: AuthUser; sessionActive: boolean } }
  | { ok: false; error: AuthErrorCode };

/**
 * Register a new account. When email confirmation is on, Supabase returns
 * no session — the caller must show the check-email state (NOT an error).
 */
export async function signUp(ports: AuthPorts, input: SignUpInput): Promise<SignUpOutcome> {
  let result;
  try {
    result = await ports.auth.signUp({
      email: input.email,
      password: input.password,
      ...(input.emailRedirectTo ? { emailRedirectTo: input.emailRedirectTo } : {}),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (result.error) return { ok: false, error: mapAuthError(result.error.message) };
  const user = toAuthUser(result.user);
  if (!user) return { ok: false, error: "unknown" };
  if (result.session) {
    persistSession(ports, result.session.access_token, result.session.refresh_token);
    return { ok: true, data: { user, sessionActive: true } };
  }
  return { ok: true, data: { user, sessionActive: false } };
}

export async function signIn(
  ports: AuthPorts,
  input: { email: string; password: string },
): Promise<AuthResult<AuthUser>> {
  let result;
  try {
    result = await ports.auth.signInWithPassword(input);
  } catch {
    return { ok: false, error: "network" };
  }
  if (result.error) return { ok: false, error: mapAuthError(result.error.message) };
  if (!result.session) return { ok: false, error: "email-not-confirmed" };
  const user = toAuthUser(result.user);
  if (!user) return { ok: false, error: "unknown" };
  persistSession(ports, result.session.access_token, result.session.refresh_token);
  return { ok: true, data: user };
}

export async function signOut(ports: AuthPorts): Promise<void> {
  try {
    await ports.auth.signOut();
  } catch {
    // Provider failure must never strand the browser session: cookies are
    // cleared regardless so the user always lands signed-out.
  } finally {
    clearSession(ports);
  }
}

/**
 * Resolve the current user from cookies. Validates the access token
 * server-side on every call; attempts one refresh before giving up; clears
 * stale cookies. Never throws — returns null when signed out.
 */
export async function getSessionUser(ports: AuthPorts): Promise<AuthUser | null> {
  const accessToken = ports.cookies.get(ACCESS_COOKIE);
  const refreshToken = ports.cookies.get(REFRESH_COOKIE);
  if (!accessToken || !refreshToken) return null;
  try {
    const checked = await ports.auth.getUser(accessToken);
    const user = toAuthUser(checked.user);
    if (!checked.error && user) return user;
    const refreshed = await ports.auth.refreshSession({ refresh_token: refreshToken });
    if (refreshed.error || !refreshed.session) {
      clearSession(ports);
      return null;
    }
    persistSession(ports, refreshed.session.access_token, refreshed.session.refresh_token);
    return toAuthUser(refreshed.user);
  } catch {
    clearSession(ports);
    return null;
  }
}

/**
 * Establish a session from raw tokens (used by the /api/auth/session bridge
 * after the callback page reads the implicit-flow fragment client-side).
 */
export async function setSessionFromTokens(
  ports: AuthPorts,
  tokens: { access_token: string; refresh_token: string },
): Promise<AuthResult<AuthUser>> {
  if (!tokens.access_token || !tokens.refresh_token) {
    return { ok: false, error: "session-missing" };
  }
  let result;
  try {
    result = await ports.auth.setSession(tokens);
  } catch {
    return { ok: false, error: "network" };
  }
  if (result.error) return { ok: false, error: mapAuthError(result.error.message) };
  const user = toAuthUser(result.user);
  if (!user) {
    clearSession(ports);
    return { ok: false, error: "unknown" };
  }
  persistSession(ports, tokens.access_token, tokens.refresh_token);
  return { ok: true, data: user };
}

/**
 * PKCE path: exchange an authorization `code` for a session (used when the
 * confirmation link carries ?code= instead of a token fragment).
 */
export async function exchangeCode(
  ports: AuthPorts,
  code: string,
): Promise<AuthResult<AuthUser>> {
  if (!code) return { ok: false, error: "session-missing" };
  let result;
  try {
    result = await ports.auth.exchangeCodeForSession(code);
  } catch {
    return { ok: false, error: "network" };
  }
  if (result.error || !result.session) {
    return { ok: false, error: mapAuthError(result.error?.message) };
  }
  const user = toAuthUser(result.user);
  if (!user) return { ok: false, error: "unknown" };
  persistSession(ports, result.session.access_token, result.session.refresh_token);
  return { ok: true, data: user };
}
