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
- **Database:** `organization_id` filter + RLS through private-schema `is_org_member`/`is_org_admin_or_owner`/`is_org_owner` helpers with `auth.uid()`; membership writes are owner/admin-controlled.
- **Runtime clients:** `@winlerr/database` is the only Supabase SDK boundary. Browser and request-scoped server clients use the publishable/anon key and enforce RLS; the server-only admin client uses the service-role key and is marked `bypassRls: true`.
- **Session resolution:** `resolveAuthContext()` first requires a Supabase session, then validates the user through `auth.getUser()`, and resolves only the explicitly requested organization membership. It never guesses an organization and treats a missing membership as an authorization miss.
- **Service-role:** `createAdminClient` is server-only, bypasses RLS, and is permitted in Phase 6 only for staging fixture setup/cleanup — never as the subject of an authorization assertion and never on a client.

## 5. Phase 6 Runtime and Fixture Strategy

The Phase 6 runtime path is established for the non-production staging project `xvwgumawzoqjduvtnlcs`: the generated `Database` type is used by the real Supabase clients, request access tokens are supported for server requests without cookie storage, and an optional framework-neutral cookie bridge supports SSR session refresh. The public and server environment helpers remain optional at foundation parse time but provide explicit required-runtime validation functions.

The authenticated integration harness creates five random disposable identities: owner, admin, member, and viewer in tenant A, plus an owner in tenant B. It provisions them only through the approved staging administrative SQL input, initializes the Auth identity/token fields required by the hosted Auth schema, runs all authorization assertions with publishable-key clients and real Auth sessions, and deletes users, organizations, memberships, and audit rows through the same exact-project guarded cleanup path. Credentials are derived in process memory and are not written to Git, logs, reports, or documentation. Cleanup verification observed zero residual Phase 6 users, organizations, memberships, and audit rows.

## 6. What Is NOT Implemented

- OAuth providers (Google/Apple/etc.) — HQ decision
- Final role/permission matrix — HQ decision
- Signup/login pages, role-management UI
- Supabase production users or production runtime configuration
- Product tables and Lead Response behavior — explicitly deferred to Phase 7

## 7. Open HQ Decisions (Preserved)

1. OAuth providers
2. Final role/permission matrix
3. Multi-organization membership rules
4. Legacy master branch disposition
5. First product priority

These remain **Current Plan/Proposal** until HQ approves; this phase does not convert them to Established.

The **staging authentication/runtime foundation itself is Established for review** by the observed Phase 6 tests. Production enablement, the final role/permission matrix, and product-specific authorization remain outside this phase.
