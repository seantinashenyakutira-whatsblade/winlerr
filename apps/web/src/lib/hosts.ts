/**
 * Winlerr host routing — explicit hostname allowlist for the single Next.js
 * app that serves both the marketing site and WinlerrOS.
 *
 * - `www.winlerr.vip` (primary) + `winlerr.vip` (apex, 308s to www at the
 *   edge) + `winlerr.vercel.app` (platform default): marketing site.
 * - `os.winlerr.vip`: WinlerrOS application entry.
 *
 * Routing policy (deliberately minimal):
 * - Only `GET /` on the OS host rewrites to the existing `/winlerros` page.
 *   Every other path — auth, dashboard, APIs, marketing deep links,
 *   compatibility aliases — passes through untouched on every host.
 * - There are NO host-to-host redirects in code, so www <-> os loops are
 *   impossible. Apex -> www is handled by Vercel, not here.
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
 * through. The ONLY rewrite is OS root `/` -> `/winlerros`; query strings
 * are preserved by the caller (middleware clones nextUrl, keeping search).
 */
export function resolveRewrite(
  rawHost: string | null | undefined,
  pathname: string | null | undefined
): string | null {
  if (getHostKind(rawHost) !== "os") return null;
  if ((pathname ?? "") === "/") return OS_ENTRY_PATH;
  return null;
}
