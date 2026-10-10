-- PROPOSAL UNDER REVIEW — DO NOT APPLY without explicit owner approval.
--
-- Purpose: least-privilege hardening of public.admin_profiles, the five
-- dependent tables' admin policies, and write-ish grants on leads/claims,
-- WITHOUT breaking: (a) dependent-table access for legitimate admins,
-- (b) anonymous INSERT flows (the only write the app performs: plain
-- .insert(), no .select() chaining, no UPDATE/DELETE anywhere in the repo
-- — verified 2026-10-10), (c) trusted service_role provisioning (service
-- role bypasses RLS and is not touched by this file in any way).
--
-- History note: the earlier proposal 20261010000000 ("users can read/update
-- own profile" policies + prevent_admin_role_change trigger) was superseded
-- before ever being applied (remote ledger: unapplied — verified) and its
-- file has been REMOVED from supabase/migrations/ on this branch. §1 below
-- still cleans up its objects by name in case any environment ran it.
-- With that file gone, `supabase db push` has no obsolete pending migration;
-- push remains forbidden without explicit approval regardless.
--
-- Supabase runs each migration inside a transaction; no explicit
-- BEGIN/COMMIT here. Every destructive step is guarded and fails closed.
--
-- Assumptions (verified, see supabase-verification-report.md §2):
--   * admin_profiles(id uuid PK → auth.users, full_name, role default
--     'admin', created_at) exists with RLS enabled, not forced.
--   * Permissive SELECT USING (true) + INSERT EXISTS-check policies TO
--     PUBLIC exist (exact names unknown → dropped by predicate in §2).
--   * Five tables carry "Admins can..." policies that gate on profile
--     EXISTENCE only (no role check): failed_submissions,
--     feature_suggestions, newsletter_campaigns, prototype_requests,
--     waitlist_leads. Their exact command coverage is established at
--     apply time by the loop in §4 (see below).
--   * No views, FKs, or ordinary functions depend on admin_profiles.

-- §0. Precondition: fail closed with a clear message if the table is absent.
do $$
begin
  if to_regclass('public.admin_profiles') is null then
    raise exception 'hardening aborted: public.admin_profiles does not exist';
  end if;
end
$$;

-- §1. Cleanup of superseded-proposal side effects (no-ops if never applied).
-- Covers environments where 20261010000000 ran before its removal.
drop policy if exists "users can read own profile" on public.admin_profiles;
drop policy if exists "users can update own profile" on public.admin_profiles;
drop trigger if exists trg_prevent_admin_role_change on public.admin_profiles;
drop function if exists public.prevent_admin_role_change();

-- §2. Drop permissive admin_profiles policies by predicate (name-agnostic):
-- any policy on admin_profiles granted to PUBLIC or anon. Policies on the
-- five dependent tables are NOT touched here (see §4).
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
    execute format('DROP POLICY %I ON public.admin_profiles', r.policyname);
    raise notice 'hardening: dropped permissive policy %', r.policyname;
  end loop;
end
$$;

-- §3. Least-privilege replacement on admin_profiles: authenticated users
-- read ONLY their own profile row. Dependent-table subqueries
-- (… WHERE id = auth.uid()) keep working: the subquery's row satisfies
-- this policy for the calling user. service_role bypasses RLS. No
-- INSERT/UPDATE/DELETE policies are created for normal roles → RLS denies
-- those writes; only service_role provisioning remains.
create policy "admin_profiles_owner_select"
  on public.admin_profiles for select to authenticated
  using (auth.uid() = id);

-- §4. Dependent tables: replace existence-only "Admins can..." policies with
-- role-gated admin-manage policies. Design decisions (see report §8):
--   * Gate: role = 'admin', strict. 'owner' is NOT included — no hierarchy
--     is defined anywhere in the repo, and silently equating owner/admin
--     would be guessing. PRE-APPLY CHECK (owner): confirm the existing
--     profile row's role is 'admin'; if the operator account uses 'owner',
--     extend the predicate to IN ('owner','admin') in review BEFORE apply.
--   * One FOR ALL policy per table (admin-manage semantics: admins read +
--     moderate). A viewer profile — or any non-admin row — matches nothing.
--   * Nested read is safe: the subquery sees only the caller's own row
--     through §3 (no recursion — admin_profiles policies read no other
--     tables), and the SELECT grant on admin_profiles is retained (§6), so
--     no permission-denied errors. service_role bypasses everything.
--   * Public INSERT policies (plain WITH CHECK, not referencing
--     admin_profiles) are never matched by the drop predicate below and
--     stay intact; anon INSERT flows keep working.
do $$
declare
  t text;
  r record;
  v_leftover int;
  v_pred text := 'EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role = ''admin'')';
begin
  foreach t in array array[
    'failed_submissions', 'feature_suggestions', 'newsletter_campaigns',
    'prototype_requests', 'waitlist_leads'
  ] loop
    if to_regclass('public.' || t) is null then
      raise exception 'hardening aborted: expected dependent table % missing', t;
    end if;
    for r in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname ilike 'Admins can%'
        and (qual ilike '%admin_profiles%' or with_check ilike '%admin_profiles%')
    loop
      execute format('DROP POLICY %I ON public.%I', r.policyname, t);
      raise notice 'hardening: dropped % on %', r.policyname, t;
    end loop;
    -- Fail closed if any OTHER admin_profiles-referencing policy remains
    -- (unknown name/shape): do not layer a replacement over it blindly.
    select count(*) into v_leftover from pg_policies
      where schemaname = 'public' and tablename = t
        and (qual ilike '%admin_profiles%' or with_check ilike '%admin_profiles%');
    if v_leftover > 0 then
      raise exception 'hardening aborted: unrecognized admin_profiles policy remains on % — review manually', t;
    end if;
    execute format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      'admins_manage_' || t, t, v_pred, v_pred);
    raise notice 'hardening: created admin-manage policy on %', t;
  end loop;
end
$$;

-- §5. Remove the dangerous role default. Existing rows keep their values
-- (defaults never backfill). All legitimate future inserts must pass an
-- explicit role (service-role sync does); without this, any future insert
-- path omitting role would silently mint admins.
alter table public.admin_profiles alter column role set default 'viewer';

-- §6. Tighten table grants. Rationale per grantee/privilege:
--   * admin_profiles: REVOKE INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/
--     TRIGGER/MAINTAIN from anon + authenticated; REVOKE SELECT from anon
--     ONLY. Authenticated SELECT is RETAINED (required for owner reads
--     and dependent-policy subquery evaluation — see note below).
--     service_role grants: untouched.
--   * leads/claims: REVOKE UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/
--     MAINTAIN from anon + authenticated. INSERT (+ inert SELECT, harmless
--     without a SELECT policy) RETAINED so anon capture flows work.
--   * Anon-evaluation note: after §2–§4, NO policy applicable to anon
--     references admin_profiles (admin policies are TO authenticated), so
--     revoking anon's SELECT grant cannot turn a dependent-table anon
--     operation into a permission error — RLS simply denies. The
--     post-deploy smoke test (§7) proves this on every public flow.
--   * Ungranted-privilege REVOKEs (e.g. MAINTAIN where never granted)
--     emit only a NOTICE, never an error. Supabase-managed defaults that
--     this file does not mention are left exactly as they are.
revoke insert, update, delete, truncate, references, trigger, maintain
  on public.admin_profiles from anon, authenticated;

revoke select
  on public.admin_profiles from anon;

revoke update, delete, truncate, references, trigger, maintain
  on public.leads, public.claims from anon, authenticated;

-- §7. Post-deployment verification (READ-ONLY — run after apply, compare):
--   select tablename, policyname, roles, cmd from pg_policies
--     where tablename in ('admin_profiles','failed_submissions',
--       'feature_suggestions','newsletter_campaigns','prototype_requests',
--       'waitlist_leads') order by 1, 2;
--     -- expect: admin_profiles_owner_select (authenticated, SELECT) +
--     -- admins_manage_* (authenticated, ALL) x5; NO TO PUBLIC policies.
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_name = 'admin_profiles' order by 1, 2;
--     -- expect: no INSERT/UPDATE/DELETE/SELECT for anon.
--   -- anon probe (anon key): admin_profiles SELECT → 0 rows; INSERT → denied.
--   -- owner probe (admin JWT): own profile row → 1 row; another id → 0 rows.
--   -- admin-manage probe: admin JWT reads/writes a test row on each of the
--   --   five tables; viewer JWT gets 0 rows / denied writes.
--   -- public-flow smoke test: submit a lead + claim + one row to each
--   --   public INSERT surface of the five tables → all succeed.

-- §8. Rollback — EMERGENCY ONLY, NOT ROUTINE. Re-enabling public access
-- re-opens the S1 exposure (world-readable profile row, holder-minted
-- admin rows). Roll back ONLY on proven breakage that forward-repair
-- cannot fix, with owner approval, and re-harden immediately after.
-- Exact original policy definitions are NOT reconstructed here (their
-- names were never tracked) — a rollback would re-create APPROXIMATE
-- public access, which is itself a finding to record:
--   create policy "admin_profiles_public_select_rollback"
--     on public.admin_profiles for select to public using (true);
--   alter table public.admin_profiles alter column role set default 'admin';
--   grant insert, update, delete, truncate, references, trigger, maintain
--     on public.admin_profiles to anon, authenticated;
--   grant select on public.admin_profiles to anon;
--   grant update, delete, truncate, references, trigger, maintain
--     on public.leads, public.claims to anon, authenticated;
--   -- dependent-table admin policies CANNOT be rolled back to unknown
--   -- originals — forward-repair only for those.
