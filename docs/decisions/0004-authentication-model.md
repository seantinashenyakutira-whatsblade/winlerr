# ADR 0004 — Authentication & Authorization Model

- **Status:** Current Plan (requires product/HQ review before Established)
- **Date:** 2026-08-21
- **Related:** ADR 0003, `docs/architecture/authentication.md`, `docs/architecture/database-architecture.md`

## Context

Winlerr is multi-tenant: one platform hosts multiple businesses/clients. “Who are you?” (authN) and “What can you do, in which organization?” (authZ) must be separated. Prior landing-page prototype in `archive-legacy-main` used a single Supabase project with no tenant model. Audit found AGENTS.md already states “server-side authorization, treat webhooks as untrusted, tenant isolation” but no schema enforces it yet.

## Decision (Current Plan, not yet Established)

- **AuthN = Supabase Auth** (email/password + recovery + OAuth-ready). No custom password hashing. Sessions via Supabase cookies (Next.js `@supabase/ssr`). OAuth providers (Google, etc.) wired when first product needs them — prepared, not premature.
- **AuthZ = membership + role + permission** (RBAC, org-scoped). Model:

```
auth.users (Supabase) 1—N memberships N—1 organizations
membership { user_id, organization_id, role, created_at }
role { owner, admin, member, viewer } + permission set
permission { resource:action } (e.g., lead:read, booking:write, agent:execute)
```

- **Tenant isolation** enforced twice: (1) application queries scoped by `organization_id`, (2) PostgreSQL **RLS policies** per table: `USING (organization_id = current_org_id())` or `auth.uid() IN (SELECT user_id FROM memberships WHERE org_id = ...)`.
- **Server-side checks required** for every privileged operation; client checks are UX only. Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only.
- `@winlerr/auth` is the sole surface: `createClient`, `requireUser`, `requireMembership`, `requirePermission`, `getOrganization`, wrappers for RLS-aware clients (browser/server/admin). No app imports Supabase Auth directly.

## Consequences (if Established)

- Every data query must include `organization_id`; missing scope is a bug and will be blocked by RLS in prod.
- Adding a new product/resource requires a permission entry, not a new auth system.
- OAuth can be added without changing membership model.

## Alternatives Considered

- **Auth0/Clerk external**: considered for faster OAuth, rejected for now — Supabase Auth already in stack and covers email + OAuth, lower integration cost.
- **ABAC only (attribute-based)**: overkill for current stage; RBAC + scoped permissions suffices until ABAC driver appears.
- **Client-side authZ**: rejected — violates AGENTS.md security rule.

## Open Questions (needs HQ/Product input)

- Required OAuth providers for launch (Google? Apple?).
- Role names and permission matrix per product (lead-response vs CRM vs booking may need distinct permission sets).
- Whether a user can belong to multiple organizations simultaneously (proposed: yes).

> This ADR is **Current Plan** until HQ confirms role/permission matrix and multi-org requirement, then it becomes Established.
