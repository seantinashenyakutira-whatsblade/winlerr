# Authentication & Authorization — Winlerr

- **Status:** Current Plan (requires HQ review per ADR 0004)
- **Platform:** Supabase Auth (AuthN), membership/RBAC (AuthZ)
- **Package:** `@winlerr/auth`
- **Related:** ADR 0004, `docs/architecture/database-architecture.md`, `docs/architecture/security.md`

## 1. Separation

```
Authentication ("who are you?")  →  Supabase Auth (session, JWT, OAuth)
Authorization ("what can you do, in which org?")  →  membership + role + permission + RLS
```

Never conflate. Never trust client-side checks.

## 2. Authentication (AuthN)

### 2.1 Initial Mechanism
- **Supabase Auth** email + password is the default. Supabase manages hashing, session cookies, JWT, password recovery.
- **Sessions**: Supabase SSR (`@supabase/ssr`) issues `sb-*` cookies; `createServerClient` reads on Route Handlers/Server Components; `@winlerr/auth` wraps it as `getUser`, `requireUser`.
- **Signup**: `supabase.auth.signUp({ email, password })` → email confirmation (configurable) → `auth.users` row. No custom user table duplicate.
- **Login**: `signInWithPassword`; on success, `organization_id` is derived from membership (user may belong to multiple orgs — proposed, pending HQ).
- **Password recovery**: `resetPasswordForEmail` → Supabase email → recovery link → `updateUser`. Rate-limited.
- **OAuth readiness**: Google (and others) prepared but not wired until first product needs it. When enabled, add `supabase.auth.signInWithOAuth({ provider: 'google' })` — no change to membership model.

### 2.2 Package Surface (`@winlerr/auth`)

```
// never import supabase directly in apps
import { createBrowserClient, createServerClient, requireUser, requireMembership, requirePermission } from "@winlerr/auth";

// Route Handler
export async function POST(req: Request) {
  const user = await requireUser(); // throws 401 if no session
  const membership = await requireMembership({ organizationId }); // throws 403 if not member
  await requirePermission(membership, "lead:write");
}
```

### 2.3 What it does NOT do yet
- No magic-link, no SSO/SAML — deferred.
- No device trust / MFA — mark as Proposal, add when HQ asks.

## 3. Authorization (AuthZ)

### 3.1 Model

```
User (auth.users) --memberships--> Organization
  membership { user_id, organization_id, role }
  role ∈ { owner, admin, member, viewer } → permission set
  permission = "resource:action" (lead:read, booking:write, agent:execute, org:admin)
```

- Roles are seed data; permissions per role are configurable but code-checked.
- `@winlerr/auth` exports `hasPermission(membership, permission)` and server guards.

### 3.2 Enforcement Order

1. **Route Handler / Server Action** calls `requirePermission(membership, permission)` — early 401/403.
2. **Database query** via `@winlerr/database` includes `organization_id` — defense-in-depth.
3. **RLS policy** on table denies cross-tenant rows even if app bug omits filter.

### 3.3 Organization Membership

- User can belong to multiple orgs (Current Plan). UI must expose org switcher; APIs require `organization_id` header/body/query, validated.
- Invitations: `memberships` row created with `role=invited`, email trigger; accepting creates session + role upgrade. Rate-limited, idempotent.

## 4. Server-Side Authorization Rule

> Every privileged operation must re-check authN/authZ on the server. Client checks are UX hints.

- No client-supplied `organization_id` is trusted without `requireMembership`.
- `SUPABASE_SERVICE_ROLE_KEY` (server-only) bypasses RLS — used only in `createAdminClient` for migrations/webhook service; never shipped to browser.

## 5. Next Steps

- HQ to confirm: role names, permission matrix per product, multi-org yes/no, required OAuth providers.
- Once confirmed, ADR 0004 moves from Current Plan → Established, then first migration for `memberships` + RLS.

