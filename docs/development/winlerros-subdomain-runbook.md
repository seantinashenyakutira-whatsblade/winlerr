# WinlerrOS Subdomain Runbook — `os.winlerr.vip` (REVIEW ONLY, nothing applied)

> Status: proposed configuration for owner review. **Do not apply** until the
> `feature/winlerros-subdomain-routing` PR is approved. No custom domain was
> added, no DNS record was created or changed, no Vercel setting was altered,
> and no Supabase URL Configuration or environment variable was modified in
> preparing this runbook.

Code slice (this PR): host-aware routing ships in
`apps/web/src/lib/hosts.ts` + `apps/web/src/middleware.ts` — `os /` rewrites
to `/winlerros`; marketing-host app routes and legacy entry paths 308 to
their OS destinations; everything else passes through on every host. What follows
is the exact live configuration to approve.

## 1. Environment audit (`NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`)

| Location                                                      | Use                                                                                                                              | Intended value                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/web/src/lib/auth-actions.ts` (`signUpAction`)           | `resolveAppUrl({APP_URL, SITE_URL})` -> `callbackUrl(appUrl, next)` = confirmation-link origin (`<origin>/auth/callback?next=…`) | Production `APP_URL` = OS host (below)                  |
| `packages/auth/src/redirects.ts` (`resolveAppUrl`)            | Prefers `APP_URL`, falls back to `SITE_URL`, trims trailing slashes                                                              | No change (fallback kept for local/dev)                 |
| `apps/web/src/app/layout.tsx` (`metadataBase`, canonical, OG) | Marketing canonical base                                                                                                         | `https://www.winlerr.vip` (set in code this PR)         |
| `apps/web/src/app/sitemap.ts`, `robots.ts`                    | Sitemap + robots base                                                                                                            | `https://www.winlerr.vip` (set in code this PR)         |
| `turbo.json` (`globalEnv`), `.env.example`                    | Build env + documented intent                                                                                                    | `.env.example` comments updated only; values stay empty |
| `README.md`, `docs/development/*`                             | Descriptive text                                                                                                                 | No live effect                                          |

Resolved intent:

- `NEXT_PUBLIC_APP_URL` = **`https://os.winlerr.vip`** in Vercel Production —
  the WinlerrOS/auth origin. Confirmation and recovery emails must return
  here so `?code=` / `#access_token` handoffs land on the host that owns
  the session cookies and the `/auth/callback` handler.
- `NEXT_PUBLIC_SITE_URL` = **`https://www.winlerr.vip`** in Vercel
  Production — the marketing canonical (metadata, sitemap, OG).
- Local: both `http://localhost:3000` (or unset `APP_URL` so the
  `SITE_URL` fallback applies — identical result).

## 2. Supabase URL Configuration (proposed, NOT applied)

Dashboard: Supabase project `Winlerr` -> Authentication -> URL Configuration.

- **Site URL:** `https://os.winlerr.vip`
- **Redirect URLs** (exact entries to add; keep existing entries, remove none):
  1. `https://os.winlerr.vip/auth/callback` — production confirmations,
     recoveries, and invites. (`?next=/dashboard…` suffixes share this
     allowlisted base path; the app re-sanitizes `next` with
     `safeNextPath` on every hop.)
  2. `http://localhost:3000/auth/callback` — local development.
  3. Preview (narrowly scoped, only if preview auth is needed):
     `https://winlerr-*-seantinashenyakutira-2100s-projects.vercel.app/auth/callback`
     — confirm the exact preview suffix in Vercel (Project -> Settings ->
     Domains / a real Preview deployment URL) before adding; never use a
     broad `https://*.vercel.app/*` wildcard.
- **Do not add:** `https://*.winlerr.vip/*` or any apex/wildcard allowlist.
  Future hosts (`api`, `hooks`, `help`, `status`) get exact entries only if
  and when they handle auth callbacks — none do today.

Why the OS host: `getViewer()` session cookies are host-scoped and the
callback bridge (`POST /api/auth/session`) sets `httpOnly` cookies for the
host that served it. Pointing Site URL at `www` would complete email
confirmation on the marketing host and strand the session there.

## 3. Vercel production environment (proposed, NOT applied)

Project `winlerr` -> Settings -> Environment Variables (Production only;
Preview/Development unchanged):

| Variable               | Value                     | Notes                                             |
| ---------------------- | ------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`  | `https://os.winlerr.vip`  | Drives `emailRedirectTo` for signup confirmations |
| `NEXT_PUBLIC_SITE_URL` | `https://www.winlerr.vip` | Marketing canonical base                          |

Apply + redeploy Production after approval. Verify with a real signup to an
owner-controlled address: the confirmation link must start with
`https://os.winlerr.vip/auth/callback?next=…`.

## 4. Vercel + Cloudflare state (VERIFIED live 2026-10-11, read-only)

`os.winlerr.vip` now resolves via Vercel DNS (`vercel-dns-017.com` chain)
and returns HTTP 200 — serving the marketing homepage (`<title>Winlerr —
Digital growth systems…`), i.e. the domain is associated but no OS
routing is live yet. No owner action was taken in this slice: no domain
was added, no DNS record created/changed, no Vercel setting altered.
`www.winlerr.vip` resolves to Cloudflare edge (proxied); project `winlerr`
serves `www.winlerr.vip`, `winlerr.vip` (308 -> www), `winlerr.vercel.app`.

1. ~~Associate the domain in Vercel + create the Cloudflare CNAME~~ —
   ALREADY LIVE (owner action outside this task): DNS resolves and the
   domain serves HTTP 200. No action needed here.
2. **Certificate:** confirm Vercel Domains shows `os.winlerr.vip` =
   Valid/Issued (automatic ACME; typically minutes after DNS resolves).
3. **Verify DNS + routing:**
   - `nslookup os.winlerr.vip` resolves to the Vercel target chain.
   - `curl -sI https://os.winlerr.vip/` -> 200 WinlerrOS entry (same
     content as the OS landing, canonical `https://os.winlerr.vip/`);
     `curl -sI https://www.winlerr.vip/` -> 200 unchanged marketing.
   - `curl -sI https://www.winlerr.vip/winlerros` -> 308 to
     `https://os.winlerr.vip/`; app routes on www (`/login`, `/dashboard`,
     …) 308 to the same path on `os`; POSTs and `/api/*` never redirect.
   - Browser matrix: `os/` renders the WinlerrOS entry; `os/login`,
     `os/signup`, `os/auth/callback`, `os/dashboard`, `os/dashboard/setup`
     behave correctly; `www/` still renders the marketing homepage.
5. **Rollback (does not touch www):** remove `os.winlerr.vip` from Vercel
   Domains, delete the `os` CNAME in Cloudflare, keep this PR's code (it is
   inert without DNS: unknown/absent host = passthrough).

## 5. Future subdomains (names only — NOT configured)

- `api.winlerr.vip` — only if a separate API service is justified.
- `hooks.winlerr.vip` — only if an independent webhook endpoint is needed.
- `help.winlerr.vip` — documentation/support portal if one is deployed.
- `status.winlerr.vip` — status service if one is deployed.

No wildcard records. Each gets an ADR + exact Supabase/Vercel entries if
proposed later.

## 6. Owner approvals needed

- [ ] Approve single-project architecture (ADR 0003).
- [ ] Approve Supabase Site URL + exact Redirect URL list (§2).
- [ ] Approve Vercel Production env values (§3) + who applies them.
- [ ] Approve Vercel domain association + Cloudflare CNAME wording (§4)
      after Vercel reveals the exact target.
- [ ] Confirm preview-auth need (or defer §2 item 3).
- [ ] Merge PR, then schedule the live steps above with verification.
