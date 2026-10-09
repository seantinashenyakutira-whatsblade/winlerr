# WinlaOS Core — Next Task (separate phase, NOT STARTED)

> Phase 0 (CI/tooling reconciliation) is complete. This document scopes the **next** authorized task only. Nothing below has been implemented.

## Entry conditions (all true)

- Branch `fix/ci-npm-toolchain` merged (or its CI/tooling changes otherwise landed on `main`).
- Remote CI green on `main`.
- `.env.example` filled locally from the Supabase dashboard (anon key) for form testing; service-role key held server-side only.

## Task: WinlaOS Core foundation

Work on a new `feature/winlaos-core` branch cut from `main`. Conventional commits. PR against `main` (until `develop` exists).

### 1. Core database migration design

- New migrations in `supabase/migrations/` for the missing expected tables: `admin_profiles`, plus WinlaOS core tables (organizations/tenants model per the architecture docs).
- Out of scope for this task: `waitlist_leads`, `prototype_requests`, `feature_suggestions`, `newsletter_campaigns`, `failed_submissions` — create only when their features are scoped.
- Every migration: RLS enabled, reversible where possible, reviewed before touching staging. **Never run against production (`uqdeuiaymoolyroppwhy`) without explicit authorization.**

### 2. RLS and cross-tenant tests

- RLS policies enforcing tenant isolation at the DB layer (per AGENTS.md §3).
- Tests proving: tenant A cannot read/write tenant B rows (leads, claims, core tables); anon key limited to INSERT-only where applicable; service-role paths stay server-only.

### 3. Authentication

- Implement `packages/auth` (currently a placeholder): Supabase Auth helpers, session handling for server components/route handlers, `admin_profiles` RBAC groundwork.
- No client-side auth shortcuts; every privileged operation re-checks authN/authZ server-side.

### 4. Pre-signup onboarding

- Define the claim → account → onboarding flow against the new core schema (today: claim flow writes to `claims` with no user identity).

### 5. WinlaOS shell

- First real surface reusing `packages/ui` + `packages/database` + `packages/auth`. Fix the scaffolded apps' broken `dev`/`build` scripts as each app becomes real (today they reference a nonexistent `app/` dir).

### 6. Subdomain routing

- Design per architecture docs (e.g. app-per-subdomain vs path routing); record the decision as an ADR in `docs/decisions/` before implementing.

## Verification required (per AGENTS.md §6)

`npm run lint && npm run typecheck && npm run test` locally, plus green remote CI on the PR. Never claim verification without running the commands.

## Explicit non-goals

No production Supabase changes without approval, no Vercel/production deploy changes, no public acquisition behavior changes (`/`, `/get-started`, claim/lead flows keep working), no secrets in git, no Social Inbox, no additional deployed apps.
