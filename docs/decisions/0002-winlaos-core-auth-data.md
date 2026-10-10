# ADR 0002 — WinlaOS Core: Auth, Data Access, and Pre-Signup Onboarding

- Status: **Proposed**
- Date: 2026-10-10
- Deciders: Winlerr engineering (owner review required before implementation beyond the design slice)

## Context

Today the platform has no identity. `apps/web` captures leads and free-website
claims through anon-key INSERT-only RLS policies (`leads`, `claims` tables) —
by design there is no anon SELECT, no users table, and no session concept.
WinlaOS needs authenticated operators (admins) and, later, tenant-scoped
client data — without weakening the acquisition flows that already work in
production.

## Decision

### 1. Supabase Auth is the identity provider

Email OTP (magic link) as the primary sign-in method; OAuth providers
(Google) only when a concrete product surface needs them. No custom
password store, no third-party auth service — one fewer secret to manage.

### 2. Session handling follows the official Next.js pattern

When the auth implementation slice lands, adopt `@supabase/ssr` (cookie-based
`createServerClient`/`createBrowserClient` in `packages/auth`) rather than
hand-rolled cookie handling. Rationale: session refresh, PKCE, and cookie
chunking have security-sensitive edge cases; hand-rolling them invites subtle
auth bugs. The new dependency is accepted deliberately at that point (it is
_not_ added in this slice). `packages/database` stays transport-only and
ssr-free so non-Next consumers (workers, scripts) keep a light client.

### 3. RLS is the primary enforcement layer; service role is server-only

- Every table: RLS enabled, least-privilege policies, anon denied by default.
- `SUPABASE_SERVICE_ROLE_KEY` never crosses into client bundles. It is used
  server-side only for: profile sync on signup, claim-to-account linking, and
  admin promotion. `packages/database/server.ts` exposes the service-role
  factory with a loud missing-key error so misconfiguration fails closed.
- Application code re-checks authorization server-side even where RLS
  applies (defense in depth, per AGENTS.md §2).

### 4. `admin_profiles`: one row per user, owner-readable, role-locked

Migration `20261010000000_create_admin_profiles_table.sql`:

- `id uuid PK → auth.users(id) ON DELETE CASCADE` — profile lifetime is
  bound to the auth user; deleting a user removes the profile, never orphan rows.
- No anon policies at all. Authenticated: SELECT own row, UPDATE own row.
- No authenticated INSERT: rows are created service-role-only during signup sync.
- `role` (`owner`/`admin`/`viewer`, default `viewer`) is immutable to
  non-service callers via `trg_prevent_admin_role_change`, which inspects the
  JWT role claim. This closes the privilege-escalation hole that an
  owner-scoped UPDATE policy would otherwise leave open.

### 5. Pre-signup onboarding: anonymous first, linked at signup

- Claim and lead flows stay **exactly as they are** (anonymous INSERT, no
  identity, no behavior change).
- At signup, a service-role sync: creates the `admin_profiles` row, then
  links pre-existing `claims` rows to the new user **only when the auth user's
  email is verified** (`email_confirmed_at IS NOT NULL`) **and** matches the
  claim email. Never link on unverified email — claim emails are self-asserted.
- Linking mechanism (exact columns) is deferred to the onboarding slice;
  no existing `claims`/`leads` columns are altered in this slice.

### 6. Tenancy preview (not in this slice)

`organizations` + membership tables and `org_id` columns on tenant data come
in the next data slice, with cross-tenant RLS tests executed against a
staging database. No tenant claims are made until those tests exist.

## Consequences

- New tables are unreadable to anon by default — any future feature needing
  public reads must add an explicit policy (reviewed), not inherit one.
- Role changes require service-role access (dashboard action or script);
  there is deliberately no self-service promotion path.
- `packages/database` table types are manually maintained until
  `supabase gen types` runs against a real project; drift risk is accepted
  short-term and flagged in the source file.

## Alternatives considered

- **Custom JWT/session store**: rejected — more secrets, more code, no benefit
  over Supabase Auth which already backs the database.
- **Service role in route handlers for reads**: rejected — bypasses RLS and
  turns every handler bug into a data-leak bug; anon-key + policies instead.
- **Putting role in `auth.users` metadata**: rejected — user-editable metadata
  is the wrong place for an authorization signal; a locked table is auditable.

## 2026-10-10 reconciliation review note (status stays Proposed)

Live production inspection (authorized, read-only; see
`docs/development/supabase-verification-report.md`) found that
`public.admin_profiles` **already exists** with a different shape
(`id`, `full_name`, `role`, `created_at`; role default `'admin'`;
permissive SELECT `USING (true)` + INSERT policies `TO PUBLIC`; no
triggers), created out-of-band — no tracked migration ever created it.

Consequences accepted in this review:

1. The `20261010000000` proposal's `CREATE TABLE IF NOT EXISTS` is a no-op
   against that table; it adds no `email` column and changes no default.
2. Owner-only policies do NOT restrict access while permissive public
   policies exist (Postgres permissive policies combine with OR). The
   proposal file now carries this warning in its header.
3. `packages/database` table types were corrected to the observed live
   shape, marked as observation-sourced until independently re-verified.
4. Open product decision (do not guess): adopt-and-evolve the existing
   table (requires proving nothing depends on the public policies, then
   explicit approval to drop them) vs a new WinlaOS identity table.
   The `prevent_admin_role_change()` trigger design stands for either path
   once a target table is settled; note it relies on the JWT role claim,
   so direct `postgres`-role SQL edits without JWT context would also be
   blocked (fail-closed; service-role-via-API, the designed path, is fine).
