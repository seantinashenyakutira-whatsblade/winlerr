"use server";

/**
 * Auth Server Actions — thin boundary between forms and @winlerr/auth.
 * All validation, session, and cookie logic lives in the package; these
 * actions only adapt Next primitives and never leak provider text.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_ERROR_COPY,
  callbackUrl,
  credentialsSchema,
  exchangeCode as coreExchangeCode,
  getSessionUser as coreGetSessionUser,
  resolveAppUrl,
  signIn as coreSignIn,
  signOut as coreSignOut,
  signUp as coreSignUp,
  type AuthErrorCode,
  type AuthPorts,
  type AuthUser,
} from "@winlerr/auth";
import { createClient } from "@supabase/supabase-js";
import { AUTH_ROUTES } from "@winlerr/auth";

export interface AuthActionResult {
  ok: boolean;
  error?: AuthErrorCode;
  errorMessage?: string;
  sessionActive?: boolean;
}

function fail(error: AuthErrorCode): AuthActionResult {
  return { ok: false, error, errorMessage: AUTH_ERROR_COPY[error] };
}

async function createPorts(): Promise<AuthPorts | null> {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !anonKey) return null;
  const store = await cookies();
  const isProduction = process.env["NODE_ENV"] === "production";
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" },
  });
  return {
    isProduction,
    cookies: {
      get: (name) => store.get(name)?.value,
      set: (name, value, options) => {
        store.set(name, value, options);
      },
      delete: (name) => {
        store.delete(name);
      },
    },
    auth: {
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
    },
  };
}

export async function getViewer(): Promise<AuthUser | null> {
  const ports = await createPorts();
  if (!ports) return null;
  return coreGetSessionUser(ports);
}

export async function signUpAction(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthActionResult> {
  const parsed = credentialsSchema.safeParse({ email: input.email, password: input.password });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    return fail(issue === "invalid-email" || issue === "email-required" ? "invalid-email" : "weak-password");
  }
  const ports = await createPorts();
  if (!ports) return fail("env-missing");
  const appUrl = resolveAppUrl({
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"],
  });
  const result = await coreSignUp(ports, {
    email: parsed.data.email,
    password: parsed.data.password,
    ...(appUrl ? { emailRedirectTo: callbackUrl(appUrl, input.next) } : {}),
  });
  if (!result.ok) return fail(result.error);
  return { ok: true, sessionActive: result.data.sessionActive };
}

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const parsed = credentialsSchema.safeParse({ email: input.email, password: input.password });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    return fail(issue === "invalid-email" || issue === "email-required" ? "invalid-email" : "weak-password");
  }
  const ports = await createPorts();
  if (!ports) return fail("env-missing");
  const result = await coreSignIn(ports, parsed.data);
  if (!result.ok) return fail(result.error);
  return { ok: true };
}

export async function exchangeCodeAction(code: string): Promise<AuthActionResult> {
  const ports = await createPorts();
  if (!ports) return fail("env-missing");
  const result = await coreExchangeCode(ports, code);
  if (!result.ok) return fail(result.error);
  return { ok: true };
}

export async function signOutAction(): Promise<never> {
  const ports = await createPorts();
  if (ports) await coreSignOut(ports);
  redirect(AUTH_ROUTES.login);
}
