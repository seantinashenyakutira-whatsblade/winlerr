# Security Architecture — Winlerr

- **Status:** Current Plan (initial RLS + boundaries, HQ decisions open)
- **Date:** 2026-08-24
- **Related:** `docs/architecture/database-architecture.md`, `docs/architecture/authentication.md`, `packages/config`, `packages/database`, `packages/auth`

## 1. Secrets & Env

- `.env` is gitignored (`.gitignore:16`), never committed. Verified via `git check-ignore .env`.
- `.env.example` is source of truth, placeholders only — no real credentials.
- `package.json:packageManager` and `.nvmrc` are canonical; no Volta/asdf competition.

## 2. Tenant Isolation

- Every organization-scoped record has `organization_id` (except `organizations` itself).
- RLS is primary: `organizations`, `memberships`, `audit_log` all have `enable row level security` + membership-based policies using `auth.uid()`.
- App scoping via `organization_id` is defense-in-depth.

## 3. Service-Role Boundary

- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- `packages/database:createAdminClient` throws if `window !== undefined` and has `bypassRls: true`.
- `createBrowserClient`/`createServerClient` use anon key and respect RLS.
- Never log service-role key — `redactConfig()` in `@winlerr/config`.

## 4. Database Access

- All access via `@winlerr/database` — no scattered Supabase clients.
- Migrations in `infrastructure/supabase/migrations/` only, no dashboard prod mutation.
- `pgcrypto` for `gen_random_uuid()`, indexes on `slug`, `organization_id`, `user_id`, `created_at`.

## 5. AuthN vs AuthZ

- AuthN via Supabase Auth; AuthZ via `memberships` + `role` + RLS.
- Pure guards in `@winlerr/auth` (`hasPermission`, `isMember`, `hasRoleAtLeast`) are checked server-side before DB.

## 6. Audit Logging

- `audit_log` is organization-scoped: `organization_id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at`.
- **Never log secrets** in `metadata` — redact before insert; no tokens, no service-role credentials.

## 7. What Is NOT Yet Enforced

- Role-based RLS refinement (blocked on HQ role matrix)
- OAuth provider secrets
- Production Supabase project (no real DB yet)
- Deployment secrets (Vercel/Cloudflare)

These are documented as blockers, not claimed as established.

## 8. Verification

- `pnpm lint/typecheck/test/build` all pass without credentials.
- `git diff` shows no secrets; `git check-ignore .env` passes.
- Tests verify admin client cannot execute on client context and audit insert requires `organization_id`.

