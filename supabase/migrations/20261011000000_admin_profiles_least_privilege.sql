-- PROPOSAL UNDER REVIEW — DO NOT APPLY without explicit owner approval.
--
-- Purpose: least-privilege hardening of public.admin_profiles, the five
-- dependent tables' admin policies and grants, and write-ish grants on leads/claims,
-- WITHOUT breaking: (a) dependent-table access for legitimate admins,
-- (b) anonymous INSERT flows (the only write the app performs: plain
-- .insert(), no .select() chaining, no UPDATE/DELETE anywhere in the repo
-- — verified 2026-10-10), (c) trusted service_role provisioning (service
-- role bypasses RLS and is not touched by this file in any way).
--
-- History note: the earlier proposal 20261010000000 was superseded before
-- being applied to production and is absent from this migration sequence.
-- This migration does not guess at or remove same-named triggers/functions.
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
--     waitlist_leads. Preflight checks below verify the four known public
--     INSERT policies and the absence of a newsletter public INSERT policy.
--   * No views, FKs, or ordinary functions depend on admin_profiles.

-- §0. Preflight: validate all required live objects and policy assumptions
-- before changing any policy or grant. These checks read metadata only and
-- never select or print profile-row contents.
do $$
declare
  t text;
  v_rls boolean;
  v_policy_count integer;
  v_expected_policy_names text[];
begin
  if to_regclass('public.admin_profiles') is null then
    raise exception 'hardening aborted: public.admin_profiles does not exist';
  end if;
  select relrowsecurity into v_rls
    from pg_class where oid = 'public.admin_profiles'::regclass;
  if not coalesce(v_rls, false) then
    raise exception 'hardening aborted: RLS is not enabled on public.admin_profiles';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_profiles'
      and column_name = 'role'
  ) then
    raise exception 'hardening aborted: public.admin_profiles.role does not exist';
  end if;
  if not exists (
    select 1 from public.admin_profiles where role in ('owner', 'admin')
  ) then
    raise exception 'hardening aborted: no owner/admin profile exists';
  end if;

  foreach t in array array[
    'failed_submissions', 'feature_suggestions', 'newsletter_campaigns',
    'prototype_requests', 'waitlist_leads'
  ] loop
    if to_regclass('public.' || t) is null then
      raise exception 'hardening aborted: expected dependent table % missing', t;
    end if;
    select relrowsecurity into v_rls
      from pg_class where oid = to_regclass('public.' || t);
    if not coalesce(v_rls, false) then
      raise exception 'hardening aborted: RLS is not enabled on public.%', t;
    end if;
    v_expected_policy_names := case t
      when 'failed_submissions' then array[
        'Admins can manage failed_submissions',
        'Anyone can insert failed_submissions'
      ]
      when 'feature_suggestions' then array[
        'Admins can delete feature_suggestions',
        'Admins can select feature_suggestions',
        'Admins can update feature_suggestions',
        'Anyone can insert feature_suggestions'
      ]
      when 'newsletter_campaigns' then array[
        'Admins can all newsletter_campaigns'
      ]
      when 'prototype_requests' then array[
        'Admins can delete prototype_requests',
        'Admins can select prototype_requests',
        'Admins can update prototype_requests',
        'Anyone can insert prototype_requests'
      ]
      when 'waitlist_leads' then array[
        'Admins can delete waitlist_leads',
        'Admins can select waitlist_leads',
        'Admins can update waitlist_leads',
        'Anyone can insert waitlist_leads'
      ]
    end;
    select count(*) into v_policy_count
      from pg_policies where schemaname = 'public' and tablename = t;
    if v_policy_count <> cardinality(v_expected_policy_names)
      or exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = t
          and not (policyname = any(v_expected_policy_names))
      ) then
      raise exception 'hardening aborted: unexpected policy set on %', t;
    end if;
    select count(*) into v_policy_count
      from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname ilike 'Admins can%'
        and (qual ilike '%admin_profiles%' or with_check ilike '%admin_profiles%');
    if v_policy_count = 0 then
      raise exception 'hardening aborted: expected admin_profiles policy missing on %', t;
    end if;
  end loop;

  -- These four existing public INSERT policies are part of the live product
  -- contract. Require their known shape before proceeding; newsletter has no
  -- anonymous INSERT policy and remains admin-only.
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='failed_submissions' and policyname='Anyone can insert failed_submissions'
    and cmd='INSERT' and roles @> array['public']::name[] and with_check='true')
    or not exists (select 1 from pg_policies where schemaname='public'
    and tablename='feature_suggestions' and policyname='Anyone can insert feature_suggestions'
    and cmd='INSERT' and roles @> array['public']::name[] and with_check='true')
    or not exists (select 1 from pg_policies where schemaname='public'
    and tablename='prototype_requests' and policyname='Anyone can insert prototype_requests'
    and cmd='INSERT' and roles @> array['public']::name[] and with_check='true')
    or not exists (select 1 from pg_policies where schemaname='public'
    and tablename='waitlist_leads' and policyname='Anyone can insert waitlist_leads'
    and cmd='INSERT' and roles @> array['public']::name[] and with_check='true') then
    raise exception 'hardening aborted: a required public INSERT policy is missing or changed';
  end if;
  if exists (select 1 from pg_policies where schemaname='public'
    and tablename='newsletter_campaigns' and cmd='INSERT'
    and (roles @> array['public']::name[] or roles @> array['anon']::name[])) then
    raise exception 'hardening aborted: unexpected anonymous INSERT policy on newsletter_campaigns';
  end if;
end
$$;

-- Separate pre-deployment operator check: the owner must run this privately
-- with the intended operator's known Auth UUID substituted. It returns only
-- a boolean and does not disclose profile-row contents:
--   select exists (select 1 from public.admin_profiles
--     where id = '<OPERATOR_AUTH_USER_UUID>'::uuid
--       and role in ('owner','admin')) as operator_is_owner_or_admin;

-- §1. Remove only the two known superseded policy names. The superseded
-- trigger/function were never applied to this production project; no trigger
-- or function cleanup is attempted here.
drop policy if exists "users can read own profile" on public.admin_profiles;
drop policy if exists "users can update own profile" on public.admin_profiles;

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

-- Fail closed if any other profile policy remains. Permissive policies OR
-- together, so even an authenticated USING (true) policy would defeat the
-- owner-only policy created below. The final admin_profiles policy set is
-- exactly one policy: admin_profiles_owner_select (authenticated SELECT).
do $$
declare
  v_leftover integer;
begin
  select count(*) into v_leftover
    from pg_policies
    where schemaname = 'public' and tablename = 'admin_profiles';
  if v_leftover > 0 then
    raise exception 'hardening aborted: unapproved admin_profiles policy remains';
  end if;
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
--   * Gate: role IN ('owner','admin') — explicit owner directive
--     (2026-10-10): owner accounts retain administrator capabilities;
--     'viewer' is excluded and gains nothing from merely holding a row.
--     The pre-apply check stands: confirm the existing profile row's
--     role is 'owner' or 'admin' before apply.
--   * One FOR ALL policy per table (admin-manage semantics: privileged
--     roles read + moderate). A viewer profile — or any other role value —
--     matches nothing.
--   * Nested read is safe: the subquery sees only the caller's own row
--     through §3 (no recursion — admin_profiles policies read no other
--     tables), and the SELECT grant on admin_profiles is retained (§6), so
--     no permission-denied errors. service_role bypasses everything.
--   * Four named public INSERT policies (failed_submissions,
--     feature_suggestions, prototype_requests, waitlist_leads) are validated
--     in §0 and are never matched by the drop predicate below. There is no
--     public INSERT policy on newsletter_campaigns; it remains admin-only.
do $$
declare
  t text;
  r record;
  v_leftover int;
  v_pred text := 'EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role IN (''owner'',''admin''))';
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

-- §6. Tighten table grants. Rationale per grantee/privilege.
-- ACL note (Q5-verified): reported table grants cover anon, authenticated
-- and service_role — NO grant to PUBLIC exists in the inspected ACL, so
-- this file revokes from named roles only and invents no PUBLIC grant.
-- Policy removal (§2/§4, which targets policies granted TO PUBLIC) and
-- privilege revocation (below) are distinct operations; both are needed
-- because either layer alone would leave access intact.
--   * admin_profiles: REVOKE INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/
--     TRIGGER/MAINTAIN from anon + authenticated; REVOKE SELECT from anon
--     ONLY. Authenticated SELECT is RETAINED (required for owner reads
--     and dependent-policy subquery evaluation — see note below).
--     service_role grants: untouched.
--   * leads/claims: REVOKE UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/
--     MAINTAIN from anon + authenticated. INSERT (+ inert SELECT, harmless
--     without a SELECT policy) RETAINED so anon capture flows work.
--   * Five dependent tables: anon loses SELECT/UPDATE/DELETE plus
--     TRUNCATE/REFERENCES/TRIGGER/MAINTAIN. Anon INSERT is retained only on
--     the four tables with validated public INSERT policies; it is revoked
--     on newsletter_campaigns. Authenticated retains CRUD grants because
--     RLS policies restrict those commands to owner/admin; non-RLS-safe
--     TRUNCATE/REFERENCES/TRIGGER/MAINTAIN are revoked.
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

revoke select, update, delete, truncate, references, trigger, maintain
  on public.failed_submissions, public.feature_suggestions,
     public.newsletter_campaigns, public.prototype_requests,
     public.waitlist_leads
  from anon;

revoke truncate, references, trigger, maintain
  on public.failed_submissions, public.feature_suggestions,
     public.newsletter_campaigns, public.prototype_requests,
     public.waitlist_leads
  from authenticated;

revoke insert on public.newsletter_campaigns from anon;

-- §7. Read-only post-deployment verification (run after approved apply).
-- Policy state: expect one admin_profiles_owner_select policy; one
-- admins_manage_* (ALL, authenticated) policy per dependent table; the four
-- validated Anyone INSERT policies; and no anonymous newsletter INSERT.
--   select schemaname, tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies where schemaname='public' and tablename in
--   ('admin_profiles','failed_submissions','feature_suggestions',
--    'newsletter_campaigns','prototype_requests','waitlist_leads')
--   order by tablename, policyname;
-- ACL state (includes PUBLIC grants, unlike role_table_grants):
--   select c.relname as table_name,
--     case when a.grantee=0 then 'PUBLIC' else r.rolname end as grantee,
--     a.privilege_type, a.is_grantable
--   from pg_class c join pg_namespace n on n.oid=c.relnamespace
--   cross join lateral aclexplode(coalesce(c.relacl, acldefault('r',c.relowner))) a
--   left join pg_roles r on r.oid=a.grantee
--   where n.nspname='public' and c.relname in
--   ('admin_profiles','failed_submissions','feature_suggestions',
--    'newsletter_campaigns','prototype_requests','waitlist_leads','leads','claims')
--   order by c.relname, grantee, a.privilege_type;
-- Runtime smoke-test matrix (use non-production test rows/accounts on staging):
--   * anon: profile SELECT/INSERT denied; public INSERT succeeds on the four
--     confirmed surfaces and fails on newsletter_campaigns; no SELECT,
--     UPDATE, DELETE, or TRUNCATE on the five dependent tables.
--   * owner and admin JWTs: own profile SELECT succeeds, other profile SELECT
--     returns no row; profile writes fail; CRUD on each dependent table works.
--   * viewer JWT: own profile SELECT works; dependent-table admin reads return
--     no rows and writes fail; public INSERT policies remain available.
--   * service_role: profile provisioning continues to work.
--   * anon leads/claims INSERT still succeeds; other revoked commands fail.
-- Static tests inspect SQL text only and do not prove migration execution,
-- effective PostgreSQL ACLs, RLS behavior, or these runtime outcomes.

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
--   -- A complete restoration of dependent-table ACLs/policies is not
--   -- provided; use forward repair rather than this approximation.
--   -- dependent-table admin policies CANNOT be rolled back to unknown
--   -- originals — forward-repair only for those.
