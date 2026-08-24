# Authentication & Authorization — Winlerr

- **Status:** Current Plan (HQ decisions open, see below)
- **Date:** 2026-08-24
- **Related:** `packages/auth`, `packages/database`, `docs/architecture/database-architecture.md`, `infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql`

## 1. Separation

- **Authentication (AuthN):** Who is this user? — Supabase Auth (`auth.users`, `auth.uid()`), session.
- **Authorization (AuthZ):** What can this user do in which organization? — `Membership` + `Role` + `Permission` + RLS.

Client checks are UX hints; server and RLS are enforcement.

## 2. Domain Model (Phase 4)

```
User (auth.users) 1—N Membership N—1 Organization
Membership { userId, organizationId, role }
Organization { id, name, slug, ownerUserId }
Session { user, organizationId, membership }
```

**Role (placeholder, not final):** `owner | admin | member | viewer` — checked via `role in (...)` in DB and `ROLE_PERMISSIONS` map in `@winlerr/auth`. Final matrix is HQ/Product decision.

**Permission (placeholder):** `resource:action` (e.g., `lead:read`, `booking:write`, `org:admin`) — illustrative, not frozen.

## 3. Membership

- `memberships` PK `(user_id, organization_id)`, FK to `organizations` and `auth.users`, `role` check.
- User may belong to multiple organizations — **Current Plan** (proposed yes), but HQ has not finalized multi-org rules, so RLS only checks membership existence, not multi-org semantics.
- `hasPermission(membership, permission)` and `isMember()` are pure utilities in `@winlerr/auth/src/guards.ts`.

## 4. Authorization Boundaries

- **Route Handler / Service:** `hasPermission(membership, permission)` before DB call.
- **Database:** `organization_id` filter + RLS `memberships where user_id = auth.uid()`.
- **Service-role:** `createAdminClient` is server-only, bypasses RLS — never on client.

## 5. What Is NOT Implemented

- OAuth providers (Google/Apple/etc.) — HQ decision
- Final role/permission matrix — HQ decision
- Signup/login pages, role-management UI
- Supabase production users or real sessions

## 6. Open HQ Decisions (Preserved)

1. OAuth providers
2. Final role/permission matrix
3. Multi-organization membership rules
4. Legacy master branch disposition
5. First product priority

These remain **Current Plan/Proposal** until HQ approves; this phase does not convert them to Established.
