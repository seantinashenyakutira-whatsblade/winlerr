-- PROPOSAL UNDER REVIEW — DO NOT APPLY without explicit owner approval.
-- See "Push-order warning" and "Rollback" sections below.
--
-- Purpose: least-privilege hardening of public.admin_profiles plus grant
-- tightening on public.leads / public.claims, WITHOUT breaking:
--   (a) the five dependent tables' RLS policies (failed_submissions,
--       feature_suggestions, newsletter_campaigns, prototype_requests,
--       waitlist_leads), which read admin_profiles with id = auth.uid();
--   (b) anonymous INSERT flows on leads and claims (the only write the
--       application performs: plain .insert(), no .select() chaining,
--       no UPDATE/DELETE anywhere in the repo — verified 2026-10-10);
--   (c) trusted service_role provisioning (service_role bypasses RLS and
--       is not touched by this file in any way).
--
-- Push-order warning: `supabase db push` applies pending migrations in
-- timestamp order, which means 20261010000000 (the superseded proposal)
-- would apply FIRST if it is still unapplied. This file is designed to
-- compose safely in either order: it drops that proposal's two policies
-- by name if present (§1) and never assumes table absence. Even so, do
-- NOT run `db push` until the proposal's fate (apply vs abandon) is
-- explicitly decided and recorded. Supabase runs each migration inside a
-- transaction; no explicit BEGIN/COMMIT here.
--
-- Assumptions (all verified, see supabase-verification-report.md §2):
--   * admin_profiles(id uuid PK → auth.users, full_name, role default
--     'admin', created_at) exists with RLS enabled.
--   * Permissive SELECT USING (true) + INSERT EXISTS-check policies TO
--     PUBLIC exist (exact names unknown → dropped by predicate in §2).
--   * No views, FKs, or ordinary functions depend on admin_profiles.

-- §0. Precondition: fail closed with a clear message if the table is absent.
do $$
begin
  if to_regclass('public.admin_profiles') is null then
    raise exception 'hardening aborted: public.admin_profiles does not exist';
  end if;
end
$$;

-- §1. Forward-compatibility: drop the superseded proposal's policies if
-- 20261010000000 was ever applied first. These are our own reviewed names.
drop policy if exists "users can read own profile" on public.admin_profiles;
drop policy if exists "users can update own profile" on public.admin_profiles;

-- §2. Drop permissive policies by predicate (name-agnostic): any policy on
-- admin_profiles granted to PUBLIC or anon. Owner-only and service-role
-- paths are recreated/retained afterwards. Policies on the five dependent
-- tables are NOT touched (different tables).
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_profiles'
      and (roles @> array['public']::name[] or roles @> array['anon']::name[])
  loop
    execute format('drop policy %I on public.admin_profiles', r.policyname);
    raise notice 'hardening: dropped permissive policy %', r.policyname;
  end loop;
end
$$;

-- §3. Least-privilege replacement: authenticated users read ONLY their own
-- profile row. Dependent-table subqueries (… WHERE id = auth.uid()) keep
-- working: the subquery's row satisfies this policy for the calling user.
-- service_role bypasses RLS and is unaffected. No INSERT/UPDATE/DELETE
-- policies are created for normal roles → RLS denies those writes; only
-- service_role provisioning remains.
create policy "admin_profiles_owner_select"
  on public.admin_profiles for select to authenticated
  using (auth.uid() = id);

-- §4. Remove the dangerous role default. Existing rows keep their values
-- (defaults never backfill). All legitimate future inserts must pass an
-- explicit role (service-role sync does); without this, any future insert
-- path that omits role would silently mint admins.
alter table public.admin_profiles alter column role set default 'viewer';

-- §5. Tighten table grants. Rationale per grantee/privilege:
--   * admin_profiles: REVOKE INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/
--     TRIGGER from anon + authenticated. SELECT grants are RETAINED:
--     required for owner reads and for dependent-policy subquery
--     evaluation (revoking SELECT would break those policies with
--     permission-denied errors).
--   * leads/claims: REVOKE UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER from
--     anon + authenticated. INSERT (+ inert SELECT, harmless without a
--     SELECT policy) RETAINED so anon capture flows keep working.
--   * service_role grants: untouched.
-- Ungranted-privilege REVOKEs emit only a NOTICE, never an error.
revoke insert, update, delete, truncate, references, trigger
  on public.admin_profiles from anon, authenticated;

revoke update, delete, truncate, references, trigger
  on public.leads, public.claims from anon, authenticated;

-- §8. Dependent-policy role question — INVESTIGATED, deliberately NOT
-- changed here. The five tables (failed_submissions, feature_suggestions,
-- newsletter_campaigns, prototype_requests, waitlist_leads) gate on
-- admin_profiles with id = auth.uid(). Whether each should ALSO require
-- role = 'admin' depends on its intent, which differs per table:
--   * If a policy means "any signed-in profile holder may act" (e.g. own
--     submissions), adding a role check would lock out legitimate users.
--   * If a policy means "admins may act on anyone's rows" (override), an
--     existence-only check is insufficient and role = 'admin' belongs there.
-- Deciding per table requires the exact predicate texts plus the product
-- intent for each table — neither is established in this proposal, and
-- silently rewriting them risks breaking live flows. Follow-up: classify
-- each of the five predicates (ownership vs admin-override) from the Q4
-- grids, then scope a second reviewed migration for the override cases
-- only. This file changes NO dependent policy.

-- §9. Post-deployment verification (READ-ONLY — run after apply, compare):
--   select policyname, roles, cmd from pg_policies
--     where tablename = 'admin_profiles';
--     -- expect ONLY admin_profiles_owner_select (authenticated, SELECT)
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_name = 'admin_profiles' order by 1, 2;
--     -- expect: no INSERT/UPDATE/DELETE for anon/authenticated
--   -- anon probe (anon key): SELECT → 0 rows; INSERT → denied.
--   -- owner probe (user JWT): SELECT own row → 1 row; other's → 0 rows.
--   -- dependent smoke test: submit a lead + claim → both succeed.

-- §10. Rollback — EMERGENCY ONLY, NOT ROUTINE. Re-enabling public access
-- re-opens the S1 exposure (world-readable profile row, holder-minted
-- admin rows). Roll back ONLY on proven breakage that forward-repair
-- cannot fix, with owner approval, and re-harden immediately after.
--   create policy "admin_profiles_public_select_rollback"
--     on public.admin_profiles for select to public using (true);
--   alter table public.admin_profiles alter column role set default 'admin';
--   grant insert, update, delete, truncate, references, trigger
--     on public.admin_profiles to anon, authenticated;
--   grant update, delete, truncate, references, trigger
--     on public.leads, public.claims to anon, authenticated;
