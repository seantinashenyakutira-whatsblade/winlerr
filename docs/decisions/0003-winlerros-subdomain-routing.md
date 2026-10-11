# ADR 0003 — WinlerrOS Subdomain Routing on the Existing Vercel Project

- Status: **Proposed**
- Date: 2026-10-11
- Deciders: Winlerr engineering (owner review required; no live DNS/auth/env changes in this slice)

## Context

The Vercel project `winlerr` (Next.js 15, App Router, repo
`seantinashenyakutira-whatsblade/winlerr`) currently serves the marketing site
on `www.winlerr.vip` (`winlerr.vip` 308-redirects to www at the edge;
`winlerr.vercel.app` also verified). `os.winlerr.vip` does not exist in DNS
(verified NXDOMAIN 2026-10-11). Cloudflare fronts `www` (proxied; edge IPs
observed) for zone `winlerr.vip`.

`origin/main` already ships the WinlerrOS product in the SAME Next.js app:
`/winlerros` entry, `/login`, `/signup`, `/auth/callback` (PKCE +
implicit-bridge), protected `/dashboard` + `/dashboard/setup` with
server-side session guards, and safe-`next` helpers in `@winlerr/auth`
(`safeNextPath`, `loginUrl`, `callbackUrl`, `resolveAppUrl`). There is no
middleware; `next.config.ts` holds only `/winlaos*` compatibility redirects.

The task: serve `www` (marketing) and `os` (WinlerrOS) coherently from the
current project, without a second Vercel project unless inspection proves
one is required.

## Decision

1. **One project, host-aware routing in code.** Next.js 15 middleware
   (`apps/web/src/middleware.ts`, matcher `["/"]`) reads ONLY the
   authoritative `host` header, classifies it against an explicit allowlist
   (`apps/web/src/lib/hosts.ts`), and performs exactly one internal
   **rewrite**: `os.winlerr.vip /` -> `/winlerros`. Everything else passes
   through on every host. No host-to-host redirects exist in code, so
   www <-> os loops are structurally impossible.
2. **Unknown hosts pass through.** `localhost`, `127.0.0.1`, Vercel preview
   `*.vercel.app` (except the known `winlerr.vercel.app` marketing alias),
   and anything unlisted get kind `unknown`: no rewrite, no redirect, no
   block. Local dev keeps the marketing root; `/winlerros` is the local OS
   entry until the DNS slice lands.
3. **Marketing canonical moves apex -> www.** `layout.tsx` (`metadataBase`,
   canonical, OG URL), `robots.ts` (sitemap URL), and `sitemap.ts` (base)
   change `https://winlerr.vip` -> `https://www.winlerr.vip` (the apex
   308-redirects to www, so apex canonicals were self-defeating).
   `/winlerros` gains `alternates.canonical: "/winlerros"` (resolves to
   `www/...`). Auth/dashboard/onboarding/preview pages keep
   `robots: { index: false }` — unchanged.
4. **Auth flow untouched.** Same paths, same `safeNextPath` guard, same
   server-side session checks work on both hosts. Confirmation-link origin
   stays driven by existing `NEXT_PUBLIC_APP_URL` -> `NEXT_PUBLIC_SITE_URL`
   fallback; no new env vars. Intended production values are documented in
   `.env.example` comments and the runbook (not applied here).
5. **Infra changes are runbook-only.** Adding `os.winlerr.vip` to Vercel,
   the Cloudflare CNAME, Supabase URL Configuration, and Vercel env values
   are proposed in `docs/development/winlerros-subdomain-runbook.md` for
   owner approval — nothing applied in this slice.

## Consequences

- `os.winlerr.vip /` serves the OS entry with a clean URL; all deep links
  (`/login`, `/dashboard`, `/systems`, `/winlaos*` aliases, APIs) behave
  identically on both hosts, so no link migration is needed.
- `/winlerros` exists on both hosts (alias on www, rewrite target on os);
  its canonical stays `www/winlerros` until a dedicated per-host metadata
  split is justified. Acceptable: one public OS entry page, no auth data.
- Middleware runs only on `/` (matcher), so edge cost and blast radius are
  minimal; `x-winlerr-host{,-kind}` request headers are set server-side for
  observability (client-supplied values overwritten).
- `docs/architecture/subdomains.md` (per-tenant `<tenant>.winlerr.vip` as a
  SEPARATE future app) is unaffected: `os.winlerr.vip` is the single
  first-party control-plane host in the existing app, not a tenant host.

## Alternatives considered

- **Separate Vercel project for OS**: rejected — same codebase, same auth
  session, same deploy pipeline; a split would duplicate env/auth state and
  complicate the callback flow with no demonstrated need.
- **`next.config.ts` rewrites with `has: [{ type: "host" }]`**: workable but
  static and harder to unit-test; middleware + pure `hosts.ts` helpers give
  normalization, explicit kinds, and vitest coverage.
- **301 redirect os `/` -> `/winlerros` (or www <-> os redirects)**: rejected
  — rewrites keep the clean `/` URL and cannot loop; redirects would also
  split SEO equity and risk loops.
- **Blocking unknown hosts with 404**: rejected — would break previews and
  local dev; passthrough is the safe default.

## References

- `apps/web/src/lib/hosts.ts`, `apps/web/src/middleware.ts`,
  `apps/web/tests/host-routing.test.ts`
- `docs/development/winlerros-subdomain-runbook.md` (env audit, Supabase URL
  Configuration, Vercel/Cloudflare steps, rollback, future names)
- `docs/architecture/subdomains.md` (tenant-host direction, unchanged)
- Verified 2026-10-11: `os.winlerr.vip` NXDOMAIN; `www.winlerr.vip` ->
  Cloudflare edge; no Vercel/Cloudflare CLI writes performed.
