/**
 * Winlerr host routing — explicit hostname allowlist for the single Next.js
 * app that serves both the marketing site and WinlerrOS.
 *
 * - `www.winlerr.vip` (primary) + `winlerr.vip` (apex, 308s to www at the
 *   edge) + `winlerr.vercel.app` (platform default): marketing site.
 * - `os.winlerr.vip`: WinlerrOS application entry.
 *
 * Routing policy:
 * - OS root `/` rewrites (internal) to the existing `/winlerros` page.
 * - On MARKETING hosts only, GET/HEAD navigations to app routes redirect
 *   (308) to the OS origin, and legacy `/winlerros*` + `/winlaos*` paths
 *   redirect to their OS destinations (query strings preserved by the
 *   caller). API routes, POST/PUT/DELETE, marketing pages, and unknown
 *   hosts never redirect — so www <-> os loops are impossible and local
 *   dev, previews, and form/API posts keep working.
 *
 * Security:
 * - Callers must pass the authoritative `host` header. `x-forwarded-host`
 *   and other forwarded headers are NEVER consulted here.
 * - Unknown hosts (localhost, preview deployments, anything not listed)
 *   pass through with kind `unknown`: no rewrite, no redirect, no block.
 */

export const OS_HOST = "os.winlerr.vip";

export const MARKETING_PRIMARY_HOST = "www.winlerr.vip";
export const MARKETING_APEX_HOST = "winlerr.vip";
export const VERCEL_DEFAULT_HOST = "winlerr.vercel.app";

export const MARKETING_HOSTS: readonly string[] = [
  MARKETING_PRIMARY_HOST,
  MARKETING_APEX_HOST,
  VERCEL_DEFAULT_HOST,
];

export const OS_HOSTS: readonly string[] = [OS_HOST];

export const MARKETING_CANONICAL_URL = "https://www.winlerr.vip";
export const OS_CANONICAL_URL = "https://os.winlerr.vip";

/** Existing WinlerrOS entry page that the OS root rewrites to. */
export const OS_ENTRY_PATH = "/winlerros";

export type HostKind = "os" | "marketing" | "unknown";

/**
 * Normalize a raw Host header value for allowlist comparison:
 * lowercase, trim, strip port and a single trailing dot.
 */
export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return "";
  let host = raw.trim().toLowerCase();
  // Strip port ("os.winlerr.vip:443" -> "os.winlerr.vip"). IPv6 literals
  // ("[::1]:3000") keep their brackets; only the last :port is removed.
  if (host.startsWith("[")) {
    const bracket = host.indexOf("]");
    if (bracket !== -1) host = host.slice(0, bracket + 1);
  } else if (host.includes(":")) {
    host = host.slice(0, host.lastIndexOf(":"));
  }
  if (host.endsWith(".")) host = host.slice(0, -1);
  return host;
}

/** Classify a normalized (or raw) host into the explicit allowlist. */
export function getHostKind(rawHost: string | null | undefined): HostKind {
  const host = normalizeHost(rawHost);
  if (!host) return "unknown";
  if ((OS_HOSTS as readonly string[]).includes(host)) return "os";
  if ((MARKETING_HOSTS as readonly string[]).includes(host)) return "marketing";
  return "unknown";
}

/**
 * Resolve the internal rewrite target for a request, or null to pass
 * through. Rewrites (URL unchanged in the browser):
 * - OS root `/` -> `/winlerros` (OS host only).
 * - Legacy `/winlaos*` aliases -> their `/winlerros*` destinations on
 *   NON-marketing hosts (marketing hosts redirect instead, handled by
 *   resolveRedirect). Query strings are preserved by the caller
 *   (middleware clones nextUrl, keeping search).
 */
export function resolveRewrite(
  rawHost: string | null | undefined,
  pathname: string | null | undefined
): string | null {
  const path = pathname ?? "";
  if (getHostKind(rawHost) === "os" && path === "/") return OS_ENTRY_PATH;
  // NOTE: /winlerros itself is deliberately NOT rewritten here (it would
  // loop back to /). Only the /winlaos* aliases rewrite, on non-marketing
  // hosts (marketing hosts redirect instead).
  if (getHostKind(rawHost) !== "marketing") {
    if (path === "/winlaos") return "/";
    if (path === "/winlaos/onboarding") return "/winlerros/onboarding";
    if (path === "/winlaos/preview") return "/winlerros/preview";
  }
  return null;
}

/** App routes that live on the OS origin (exact paths). */
export const OS_APP_PATHS: readonly string[] = [
  "/login",
  "/signup",
  "/auth/callback",
  "/dashboard",
];

/** App route prefixes that live on the OS origin (dashboard subtree). */
export const OS_APP_PREFIXES: readonly string[] = ["/dashboard/"];

/** Legacy marketing-host paths mapped to OS destinations (path only). */
export function mapLegacyPath(pathname: string): string | null {
  if (pathname === "/winlerros") return "/";
  if (pathname === "/winlaos") return "/";
  if (pathname === "/winlaos/onboarding") return "/winlerros/onboarding";
  if (pathname === "/winlaos/preview") return "/winlerros/preview";
  if (pathname.startsWith("/winlerros/")) return pathname;
  return null;
}

export interface HostRedirect {
  /** Absolute destination origin host (always the OS host). */
  hostname: string;
  /** Destination path on that host. Caller preserves the query string. */
  pathname: string;
}

function isAppPath(pathname: string): boolean {
  if ((OS_APP_PATHS as readonly string[]).includes(pathname)) return true;
  return OS_APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Resolve a marketing -> OS redirect, or null to pass through.
 * Only GET/HEAD navigations on MARKETING hosts redirect; everything else
 * (API routes, POST/PUT/DELETE, marketing pages, OS/unknown hosts) passes
 * through untouched.
 */
export function resolveRedirect(
  rawHost: string | null | undefined,
  pathname: string | null | undefined,
  method: string | null | undefined
): HostRedirect | null {
  if (method !== "GET" && method !== "HEAD") return null;
  if (getHostKind(rawHost) !== "marketing") return null;
  const path = pathname ?? "";
  if (isAppPath(path)) return { hostname: OS_HOST, pathname: path };
  const legacy = mapLegacyPath(path);
  if (legacy !== null) return { hostname: OS_HOST, pathname: legacy };
  return null;
}
