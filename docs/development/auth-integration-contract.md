# Auth Integration Contract (backend → Codex)

> Implemented on `feature/winlaos-auth-core`. Backend owns flows and data
> contracts below; Codex owns visual design. Do not change paths, action
> signatures, or redirect rules without updating this file.

## Routes (all in `apps/web`, no new app)

| Route | Type | Behavior |
|---|---|---|
| `/login?next=` | server page | Signed-in users bounce to sanitized `next` (default `/dashboard`). Renders `LoginForm`. `noindex`. |
| `/signup?next=` | server page | Same bounce rule. Renders `SignupForm`, incl. check-email state. `noindex`. |
| `/auth/callback?next=` | client page | Handles `?code=` (PKCE exchange) and `#access_token` fragments (implicit bridge via `POST /api/auth/session`); preserves `next` through both. Loading + error states included. |
| `POST /api/auth/session` | route handler | `{access_token, refresh_token}` → `httpOnly` cookies. Zod-validated, rate-limited (10/min/IP). 200/400/401/429/503 only. |
| `/dashboard` | protected server page | Unauthenticated → `redirect(/login?next=/dashboard)`. Shows account panel (`user.email`, `user.id`, email-confirmed) + sign-out form. `noindex`. |
| `/get-started` | public (unchanged flow) | Additive sign-in / create-account links only. |

## Server actions (`src/lib/auth-actions.ts`, `"use server"`)

- `signUpAction({email, password, next?}) → {ok, error?, errorMessage?, sessionActive?}` — `sessionActive:false` means confirmation pending (show check-email, NOT an error).
- `signInAction({email, password}) → {ok, error?, errorMessage?}`
- `exchangeCodeAction(code) → {ok, error?, errorMessage?}`
- `signOutAction() → redirect(/login)` (never returns).
- `getViewer() → AuthUser | null` (fail-closed; null on missing env).
- All failures use `AuthErrorCode` + `AUTH_ERROR_COPY` copy — never raw provider text.

## Shared contract (`@winlerr/auth`, framework-free)

- `AuthUser {id, email, emailConfirmed}`, `AuthState {user, loading}`, `AuthResult<T>`.
- `safeNextPath()` — only same-origin `/…` paths survive; everything else → `/dashboard`. `loginUrl(next)`, `callbackUrl(appUrl, next)`.
- `AuthForm` contract (Codex: keep stable): props `{submitLabel, pendingLabel, next, onSubmit, onSuccessNavigateTo, extraBelowForm}`; element ids `auth-email`, `auth-password`, error node `role="alert"`; dashboard test ids `dashboard-user-email`, `dashboard-user-id`.

## Redirect rules (no loops, no lost params)

- Protected pages redirect out with `next` set; auth pages redirect away when already signed in; `next` is re-sanitized at every hop; `/login` and `/signup` can never be redirect targets.

## Environment (existing names only — no new vars)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required; missing → fail-closed null/`env-missing`), `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_SITE_URL` fallback for the confirmation-link origin. No service-role key anywhere near this slice.

## Explicit integration dependencies (NOT faked)

- `getAdminProfile()` in `@winlerr/auth/next` **throws by design** — organization/role reads are blocked until the `admin_profiles` security migration lands (ADR 0002). Dashboard shows account identity only; no roles, no org switching.
- Session cookies (`winlerr-sb-access`, 7-day refresh) are httpOnly; no token in JS, no localStorage.

## Verification

`npm run lint/typecheck/test` green incl. 30 new auth unit tests (redirects, errors, validation, full session lifecycle with faked ports — signup/sessionless, signin variants, refresh, fail-closed clears, callback paths). No test user created; no production contact.
