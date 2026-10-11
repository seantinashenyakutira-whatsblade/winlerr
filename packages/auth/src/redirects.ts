/**
 * @winlerr/auth — redirect helpers.
 *
 * All post-auth navigation flows through here so callback parameters are
 * never lost and open redirects are impossible. Framework-free + tested.
 */
import { AUTH_ROUTES } from "./types.js";

/**
 * Accept only same-origin absolute paths ("/dashboard", "/get-started").
 * Rejects protocol-relative ("//evil"), backslashes, schemes, and empties.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return AUTH_ROUTES.dashboard;
  let parsed: URL;
  try {
    parsed = new URL(raw, "https://winlerr.local");
  } catch {
    return AUTH_ROUTES.dashboard;
  }
  const path = parsed.pathname + parsed.search + parsed.hash;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return AUTH_ROUTES.dashboard;
  }
  if (parsed.pathname === "/login" || parsed.pathname === "/signup") {
    return AUTH_ROUTES.dashboard;
  }
  return path || AUTH_ROUTES.dashboard;
}

export function loginUrl(next?: string | null): string {
  return `${AUTH_ROUTES.login}?next=${encodeURIComponent(safeNextPath(next))}`;
}

export function signupUrl(): string {
  return AUTH_ROUTES.signup;
}

/** Absolute email-confirmation target: <appUrl>/auth/callback?next=... */
export function callbackUrl(appUrl: string, next?: string | null): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}${AUTH_ROUTES.callback}?next=${encodeURIComponent(safeNextPath(next))}`;
}

/** Resolve the public app origin from existing env names (no new vars). */
export function resolveAppUrl(env: {
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}): string | null {
  const url = env["NEXT_PUBLIC_APP_URL"] ?? env["NEXT_PUBLIC_SITE_URL"];
  if (!url) return null;
  return url.replace(/\/+$/, "");
}
