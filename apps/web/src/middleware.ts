import { NextResponse, type NextRequest } from "next/server";
import {
  getHostKind,
  normalizeHost,
  resolveRedirect,
  resolveRewrite,
} from "@/lib/hosts";

/**
 * Host-aware routing for the single Vercel project serving both names.
 *
 * - `os.winlerr.vip /` rewrites (not redirects) to `/winlerros`, so the OS
 *   entry keeps a clean `/` URL on its own host.
 * - On MARKETING hosts, GET/HEAD navigations to app routes (`/login`,
 *   `/signup`, `/auth/callback`, `/dashboard*`) 308-redirect to the OS
 *   origin, and legacy `/winlerros*` + `/winlaos*` paths redirect to their
 *   OS destinations. Query strings are preserved (nextUrl clone).
 * - Everything else passes through: API routes, non-GET/HEAD methods
 *   (form/API POSTs are never redirected), marketing pages, OS-host
 *   requests, and unknown hosts (localhost, previews).
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

  const redirect = resolveRedirect(host, request.nextUrl.pathname, request.method);
  if (redirect) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = redirect.hostname;
    url.port = "";
    url.pathname = redirect.pathname;
    return NextResponse.redirect(url, 308);
  }

  const target = resolveRewrite(host, request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/dashboard",
    "/dashboard/:path*",
    "/winlerros",
    "/winlerros/:path*",
    "/winlaos",
    "/winlaos/:path*",
  ],
};
