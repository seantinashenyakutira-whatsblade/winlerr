# Database Architecture — Winlerr

- **Status:** Current Plan (initial migration shipped as placeholder, RLS minimal, HQ decisions open)
- **Date:** 2026-08-24
- **Branch:** `feature/domain-persistence-foundation` (from `develop` 275d221, stacked on `feature/platform-contracts` a803b8b)
- **Related:** `packages/database`, `infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql`, `docs/architecture/platform-contracts.md`

## 1. Platform

- **PostgreSQL via Supabase** — managed, RLS, `gen_random_uuid()`, `pgcrypto`.
- **Supabase Auth** (`auth.users`) is the identity source; domain tables reference it.
- **Migrations:** `infrastructure/supabase/migrations/<timestamp>_<name>.sql`, committed, reviewed, applied via Supabase CLI. Never mutate prod via dashboard.

## 2. Domain Boundaries (Phase 4)

Phase 4 establishes **only** the platform domain:

```
Platform
  ↓
Organization  (tenant — business/client)
  ↓
Membership  (user ↔ organization + role)
  ↓
User  (Supabase auth.users)
  ↓
Audit Log  (organization-scoped events)
```

**Initial tables (migration 20260824120000):**

| Table | Purpose | Key |
|-------|---------|-----|
| `organizations` | Tenant | `id uuid pk`, `name`, `slug unique`, `owner_user_id → auth.users`, `created_at`, `updated_at` |
| `memberships` | Org membership + role | `user_id → auth.users`, `organization_id → organizations`, `role check (owner/admin/member/viewer)`, PK `(user_id, organization_id)` |
| `audit_log` | Org-scoped events | `id uuid pk`, `organization_id → organizations`, `actor_user_id → auth.users`, `action`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at` |

**Not created (future product phases):**
`leads`, `bookings`, `customers`, `conversations`, `messages`, `campaigns`, `products`, `payments`, `subscriptions` — explicitly deferred.

## 3. Multi-Tenancy

- **Every organization-scoped record has `organization_id uuid not null`** — except `organizations` itself (it *is* the tenant). This is the tenant isolation column.
- **Application scoping:** All queries must include `organization_id` filter (defense-in-depth via `conventions.tenantColumn`).
- **RLS is primary:** Row Level Security policies enforce tenant isolation at the DB layer, not just in app code.

## 4. Row Level Security (Minimal, HQ-Blocked)

RLS is enabled on all three tables. Policies are **membership-based only**, not role-based, because the following remain **HQ decisions** (not silently converted):

1. Final role/permission matrix
2. Multi-organization membership rules
3. OAuth providers
4. Legacy master branch
5. First product priority

**Implemented policies (see migration):**

- `organizations`: `select` where `id in (memberships where user_id = auth.uid())`; `insert` for `authenticated`; `update` where member.
- `memberships`: `select` where `user_id = auth.uid()` or org in user's memberships; `insert` where self or org admin/owner.
- `audit_log`: `select/insert` where `organization_id` in user's memberships and `actor_user_id = auth.uid()` (or null).

**What is NOT implemented as RLS yet (blocked):**
- Role-based write restrictions beyond membership existence (requires final role matrix)
- Organization creation quotas, slug validation beyond uniqueness
- Audit log retention / partitioning

These are documented as blockers, not invented.

## 5. Server-Side Access & Boundaries

- **Browser:** `createBrowserClient({ supabaseUrl, supabaseAnonKey })` — anon key, RLS enforced.
- **Server:** `createServerClient(config)` — anon key + cookies, throws on client.
- **Admin:** `createAdminClient({ supabaseUrl, serviceRoleKey })` — **server-only**, `bypassRls: true`, throws on `window`. Never expose to client bundles.
- Applications must import via `@winlerr/database`, not scatter `supabase-js` clients.

## 6. Migration Discipline

- `infrastructure/supabase/migrations/.gitkeep` → `20260824120000_domain_persistence_foundation.sql` is the first real migration.
- Includes: `pgcrypto`, tables, indexes, `handle_updated_at()` trigger, RLS `enable`, policies.
- Future migrations must be reviewed, tested locally via `supabase db push`, and never mutate prod without commit.

## 7. Types

- `packages/database/src/types.ts` defines `OrganizationRow`, `MembershipRow`, `AuditLogRow` aligned with SQL, and `Database` for `supabase-js` when wired.
- Generated types location: `packages/database/src/types.generated.ts` (to be created via `supabase gen types` after first real DB).

## 8. Security Notes

- RLS policies use `auth.uid()` and `memberships` — no cross-tenant leakage via `organization_id`.
- `audit_log.metadata` is `jsonb` — **never log secrets** there; `redactConfig()` pattern applies.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only; admin client enforces server-only.

## 9. What Remains Future Work

- Real Supabase project wiring (no prod DB yet)
- Extending `Database` types via generation
- Product tables (leads, bookings, etc.)
- Role-based RLS refinement after HQ approves matrix
- Audit log retention / GDPR handling
