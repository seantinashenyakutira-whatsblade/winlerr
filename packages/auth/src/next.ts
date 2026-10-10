/**
 * @winlerr/auth/next — thin Next.js adapter (App Router).
 *
 * SERVER-ONLY by convention: import exclusively from server components,
 * route handlers, and server actions. Never import from client components
 * (it constructs clients with server-side session handling).
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  type CookieStore,
} from "./cookies.js";
import {
  getSessionUser as coreGetSessionUser,
  type AuthPorts,
  type SupabaseAuthPort,
} from "./session.js";
import { loginUrl, safeNextPath } from "./redirects.js";
import type { AuthUser } from "./types.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[auth] missing required env ${name}`);
  return value;
}

function createAuthPort(): SupabaseAuthPort {
  const client = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" } },
  );
  return {
    signUp: ({ email, password, emailRedirectTo }) =>
      client.auth
        .signUp({ email, password, options: emailRedirectTo ? { emailRedirectTo } : undefined })
        .then((r) => ({
          user: r.data.user ? { id: r.data.user.id, email: r.data.user.email ?? null } : null,
          session: r.data.session
            ? { access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token }
            : null,
          error: r.error ? { message: r.error.message } : null,
        })),
    signInWithPassword: ({ email, password }) =>
      client.auth.signInWithPassword({ email, password }).then((r) => ({
        user: r.data.user ? { id: r.data.user.id, email: r.data.user.email ?? null } : null,
        session: r.data.session
          ? { access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token }
          : null,
        error: r.error ? { message: r.error.message } : null,
      })),
    signOut: () =>
      client.auth.signOut().then((r) => ({
        error: r.error ? { message: r.error.message } : null,
      })),
    setSession: ({ access_token, refresh_token }) =>
      client.auth.setSession({ access_token, refresh_token }).then((r) => ({
        user: r.data.user
          ? { id: r.data.user.id, email: r.data.user.email ?? null, email_confirmed_at: r.data.user.email_confirmed_at ?? null }
          : null,
        error: r.error ? { message: r.error.message } : null,
      })),
    refreshSession: ({ refresh_token }) =>
      client.auth.refreshSession({ refresh_token }).then((r) => ({
        user: r.data.user
          ? { id: r.data.user.id, email: r.data.user.email ?? null, email_confirmed_at: r.data.user.email_confirmed_at ?? null }
          : null,
        session: r.data.session
          ? { access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token }
          : null,
        error: r.error ? { message: r.error.message } : null,
      })),
    getUser: (accessToken) =>
      client.auth.getUser(accessToken).then((r) => ({
        user: r.data.user
          ? { id: r.data.user.id, email: r.data.user.email ?? null, email_confirmed_at: r.data.user.email_confirmed_at ?? null }
          : null,
        error: r.error ? { message: r.error.message } : null,
      })),
    exchangeCodeForSession: (code) =>
      client.auth.exchangeCodeForSession(code).then((r) => ({
        user: r.data.user ? { id: r.data.user.id, email: r.data.user.email ?? null } : null,
        session: r.data.session
          ? { access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token }
          : null,
        error: r.error ? { message: r.error.message } : null,
      })),
  };
}

async function createPorts(): Promise<AuthPorts> {
  const store = await cookies();
  const isProduction = process.env["NODE_ENV"] === "production";
  const jar: CookieStore = {
    get: (name) => store.get(name)?.value,
    set: (name, value, options) => {
      store.set(name, value, options ?? cookieOptions(isProduction));
    },
    delete: (name) => {
      store.delete(name);
    },
  };
  return { cookies: jar, auth: createAuthPort(), isProduction };
}

/** Resolve the current user or null. Never throws. */
export async function getSessionUser(): Promise<AuthUser | null> {
  return coreGetSessionUser(await createPorts());
}

/**
 * Page guard: returns the user when signed in, otherwise redirects to
 * /login?next=<path>. Call at the top of protected server pages.
 */
export async function requireUser(next?: string | null): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(loginUrl(next));
  return user;
}

/** Explicit dependency: org/role reads are unavailable until the admin_profiles hardening lands. */
export async function getAdminProfile(): Promise<never> {
  throw new Error(
    "[auth] admin profiles unavailable — blocked on the admin_profiles security migration (see ADR 0002).",
  );
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
export { safeNextPath };
