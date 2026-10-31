/**
 * @winlerr/auth — redirect helpers.
 *
 * Centralizes the immediate post-auth destination as a same-origin path.
 * Configured callback origins and redirects in other routes need their own
 * validation. Framework-free + tested.
 */
import { AUTH_ROUTES } from "./types.js";

const REDIRECT_ORIGIN = "https://winlerr.local";
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const AMBIGUOUS_ESCAPE = /%(?:25)*(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i;

/** Validate both the normalized path and paths a downstream decoder could see. */
function safePathname(pathname: string): boolean {
  let candidate = pathname;
  // Bound work on untrusted input and reject paths that need excessive decoding.
  for (let pass = 0; pass < 8; pass += 1) {
    if (
      !candidate.startsWith("/") ||
      candidate.startsWith("//") ||
      candidate.includes("\\") ||
      CONTROL_CHARACTER.test(candidate) ||
      AMBIGUOUS_ESCAPE.test(candidate)
    ) {
      return false;
    }
    let normalized: URL;
    try {
      normalized = new URL(candidate, REDIRECT_ORIGIN);
    } catch {
      return false;
    }
    if (normalized.origin !== REDIRECT_ORIGIN || normalized.pathname.startsWith("//")) {
      return false;
    }
    const route = normalized.pathname.replace(/\/+$/, "");
    if (route === AUTH_ROUTES.login || route === AUTH_ROUTES.signup || route === AUTH_ROUTES.callback) {
      return false;
    }
    if (!/%[0-9a-f]{2}/i.test(candidate)) return true;
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return true;
      candidate = decoded;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Accept only a same-origin absolute path. Recheck the parsed output: dot
 * segments can otherwise turn a seemingly local input into a //host URL.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    CONTROL_CHARACTER.test(raw)
  ) {
    return AUTH_ROUTES.dashboard;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw, REDIRECT_ORIGIN);
  } catch {
    return AUTH_ROUTES.dashboard;
  }
  const path = parsed.pathname + parsed.search + parsed.hash;
  if (parsed.origin !== REDIRECT_ORIGIN || path.startsWith("//") || !safePathname(parsed.pathname)) {
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
