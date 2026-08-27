# Database Architecture — Winlerr

- **Status:** Established for reviewed staging runtime; RLS remains membership-based and HQ decisions remain open
- **Date:** 2026-08-27
- **Candidate branch:** `feature/staging-auth-runtime` (based on `feature/staging-supabase-foundation` at `57a4c0e`)
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

| Table           | Purpose               | Key                                                                                                                                                     |
| --------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizations` | Tenant                | `id uuid pk`, `name`, `slug unique`, `owner_user_id → auth.users`, `created_at`, `updated_at`                                                           |
| `memberships`   | Org membership + role | `user_id → auth.users`, `organization_id → organizations`, `role check (owner/admin/member/viewer)`, PK `(user_id, organization_id)`                    |
| `audit_log`     | Org-scoped events     | `id uuid pk`, `organization_id → organizations`, `actor_user_id → auth.users`, `action`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at` |

**Not created (future product phases):**
`leads`, `bookings`, `customers`, `conversations`, `messages`, `campaigns`, `products`, `payments`, `subscriptions` — explicitly deferred.

## 3. Multi-Tenancy

- **Every organization-scoped record has `organization_id uuid not null`** — except `organizations` itself (it _is_ the tenant). This is the tenant isolation column.
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

- `organizations`: `select` through the locked-down `is_org_member(id)` helper; `insert` for an authenticated user whose `owner_user_id = auth.uid()`; `update` through the membership helper.
- `memberships`: `select` where `user_id = auth.uid()` or `is_org_member(organization_id)`; `insert` where the caller owns the organization or is an owner/admin member.
- `audit_log`: `select/insert` through `is_org_member(organization_id)` with `actor_user_id = auth.uid()` (or null).

**What is NOT implemented as RLS yet (blocked):**

- Role-based write restrictions beyond membership existence (requires final role matrix)
- Organization creation quotas, slug validation beyond uniqueness
- Audit log retention / partitioning

These are documented as blockers, not invented.

## 5. Server-Side Access & Boundaries

- **Browser:** `createBrowserClient({ supabaseUrl, supabaseKey })` uses the publishable/anon key and enforces RLS.
- **Server:** `createServerClient(config)` uses the publishable/anon key, supports a request access token or framework-neutral cookie bridge, and throws on client execution.
- **Admin:** `createAdminClient({ supabaseUrl, supabaseKey })` is **server-only**, `bypassRls: true`, and is permitted in Phase 6 only for the approved staging fixture setup/cleanup path. It is never used as the subject of runtime authorization assertions.
- Applications must import via `@winlerr/database`; only that package imports `@supabase/supabase-js`/`@supabase/ssr`.
- `@winlerr/auth` resolves the current user with `auth.getUser()` and the explicitly requested membership through the RLS-backed client; it never guesses an organization.

## 6. Migration Discipline

- `infrastructure/supabase/migrations/.gitkeep` → `20260824120000_domain_persistence_foundation.sql` is the first real migration.
- Includes: `pgcrypto`, tables, indexes, `handle_updated_at()` trigger, RLS `enable`, policies.
- Future migrations must be reviewed, tested locally via `supabase db push`, and never mutate prod without commit.

## 7. Types

- `packages/database/src/types.generated.ts` is generated from Winlerr Staging and contains the live `Database`, `Tables`, `TablesInsert`, and `TablesUpdate` types.
- `packages/database/src/types.ts` derives the repository’s `OrganizationRow`, `MembershipRow`, `AuditLogRow`, and role aliases from the generated schema while preserving the public package boundary.
- Regenerate with the documented Supabase project command after every reviewed staging migration; never commit secrets or environment values in generated output.

## 8. Security Notes

- RLS policies use `auth.uid()` through narrowly scoped `SECURITY DEFINER` membership helpers with a fixed `search_path`; this avoids recursive direct membership-policy subqueries while preserving `organization_id` isolation.
- `audit_log.metadata` is `jsonb` — **never log secrets** there; `redactConfig()` pattern applies.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only; admin client enforces server-only.

## 9. What Remains Future Work

- Production Supabase project wiring; the current cloud project is explicitly non-production staging
- Product tables (leads, bookings, etc.) and all product endpoints/UI
- Role-based RLS refinement after HQ approves the final matrix
- Audit log retention / GDPR handling
- Framework-specific cookie adapters and application route integration
- A durable deployment-secret setup for production; Phase 6 used no production credentials
