# Auth Integration Contract (backend → Codex)

> Implemented on `feature/winlaos-auth-core`. Backend owns flows and data
> contracts below; Codex owns visual design. Do not change paths, action
> signatures, or redirect rules without updating this file.

## Routes (all in `apps/web`, no new app)

| Route | Type | Behavior |
|---|---|---|
| `/login?next=` | server page | Signed-in users bounce to sanitized `next` (default `/dashboard`). Renders `LoginForm`. `noindex`. |
| `/signup?next=` | server page | Same bounce rule. Renders `SignupForm`, incl. check-email state. `noindex`. |
| `/auth/callback?next=` | client page | Attempts `?code=` exchange and handles `#access_token` fragments via `POST /api/auth/session`; preserves sanitized `next` through both. Loading + error states included. PKCE verifier persistence and end-to-end behavior remain unverified. |
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

## Shared contract (`@winlerr/auth`, framework-free))

- `AuthUser {id, email, emailConfirmed}`, `AuthState {user, loading}`, `AuthResult<T>`.
- `safeNextPath()` — only same-origin `/…` paths survive; everything else → `/dashboard`. The parsed path is revalidated after URL normalization; ambiguous encoded path separators, control characters, deeply nested or invalid encodings, and auth-loop targets are rejected. Query strings and fragments on an otherwise safe destination are preserved. `loginUrl(next)`, `callbackUrl(appUrl, next)`.
- `AuthForm` contract (Codex: keep stable): props `{submitLabel, pendingLabel, next, onSubmit, onSuccessNavigateTo, extraBelowForm}`; element ids `auth-email`, `auth-password`, error node `role="alert"`; dashboard test ids `dashboard-user-email`, `dashboard-user-id`. `onSubmit` may return `{ok: true, navigate: false}` to stay on the current page; successful results without `navigate` retain the existing navigation behavior. Confirmation-pending signup uses this state instead of navigating away from the check-email message.

## Redirect rules (no loops, no lost params)

- Protected pages redirect out with `next` set; auth pages redirect away when already signed in; `next` is re-sanitized at every hop; `/login`, `/signup`, and `/auth/callback` (including trailing-slash and decoded equivalents) can never be redirect targets.
- The sanitizer constrains the immediate destination to a local path. It does not validate separately configured application origins or make unrelated server routes safe if those routes perform their own redirects.

## Environment (existing names only — no new vars)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required; missing → fail-closed null/`env-missing`), `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_SITE_URL` fallback for the confirmation-link origin. No service-role key anywhere near this slice.

## Explicit integration dependencies (NOT faked)

- `getAdminProfile()` in `@winlerr/auth/next` **throws by design** pending admin-profile security work (ADR 0002). Organization memberships use the separate workspace package; its database contracts and deployed RLS remain unverified, and workspace switching is not established.
- Session cookies (`winlerr-sb-access`, 7-day refresh) are httpOnly. The implicit callback temporarily reads tokens from the URL fragment in client-side JavaScript before posting them to the session bridge; do not log callback URLs or tokens or put tokens in localStorage. This is not proof of end-to-end callback security.

## Codex interface additions (backend-proposed, additive only)

- `AuthExperience` accepts optional `form?: ReactNode`, rendered in place
  of the disabled preview block when provided; when absent the preview
  renders exactly as before. Pages pass the real `LoginForm`/`SignupForm`.
- `DashboardShell` accepts optional `accountEmail?: string | null` and
  `onSignOut?: () => Promise<void>` (a Server Action). When absent, the
  account menu keeps its preview content byte-for-byte. `/dashboard`
  passes the live session email + `signOutAction`.

## Naming and routes

- User-facing strings added by the backend use **WinlerrOS**. Pre-existing
  "WinlaOS" visuals under `components/winlaos/**` and `/winlaos/*` are
  Codex-owned and untouched here.
- `/login`, `/signup`, `/dashboard` remain as aliases. Canonical
  `/winlerros` paths + compatibility redirects need Codex coordination —
  not created unilaterally in this slice.

## Verification

The auth package includes unit tests for redirects, errors, validation, and session lifecycle with faked ports. The web package includes component-boundary tests with mocked hooks, navigation, and provider actions for confirmation-pending versus active-session signup. These tests do not exercise a real browser, Supabase confirmation delivery, PKCE, recovery, refresh, logout, staging, or production; those flows require separate end-to-end validation. See the delivery handoff for commands and results for the specific patch.
