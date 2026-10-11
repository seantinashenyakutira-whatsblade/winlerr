import { NextResponse, type NextRequest } from "next/server";
import { getHostKind, normalizeHost, resolveRewrite } from "@/lib/hosts";

/**
 * Host-aware routing for the single Vercel project serving both names.
 *
 * - `os.winlerr.vip /` rewrites (not redirects) to `/winlerros`, so the OS
 *   entry keeps a clean `/` URL on its own host.
 * - Every other path passes through on every host: auth (`/login`,
 *   `/signup`, `/auth/callback`), `/dashboard`, `/dashboard/setup`, APIs,
 *   marketing pages, and `/winlaos*` compatibility aliases.
 * - Only the authoritative `host` header is read. Forwarded-host headers
 *   are ignored so spoofed values can never change routing.
 */
export function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"));
  const kind = getHostKind(host);

  // Overwrite (never trust) any client-supplied tracing headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-winlerr-host", host);
  requestHeaders.set("x-winlerr-host-kind", kind);

  const target = resolveRewrite(host, request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

/** Only the root can ever rewrite, so only it needs to run middleware. */
export const config = {
  matcher: ["/"],
};
