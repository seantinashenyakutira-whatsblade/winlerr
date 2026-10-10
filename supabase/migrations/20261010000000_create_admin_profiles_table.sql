-- WinlaOS core: admin_profiles — PROPOSAL UNDER REVIEW, DO NOT APPLY.
--
-- ⚠️ 2026-10-10 reconciliation finding: public.admin_profiles ALREADY EXISTS
-- in production with a DIFFERENT shape (observed via authorized inspection:
-- columns id, full_name, role, created_at; role default 'admin'; permissive
-- SELECT USING (true) + INSERT policies TO PUBLIC; no triggers). It was
-- created out-of-band — no tracked migration ever created it (verified via
-- git history). Consequences for this proposal:
--   1. The CREATE TABLE IF NOT EXISTS below is a NO-OP against that table;
--      it does NOT add an `email` column and does NOT change the default.
--   2. The owner-only policies below would OR-combine (Postgres permissive
--      policies use OR logic) with the existing public policies, leaving
--      public read/insert FULLY INTACT. This file as written does NOT
--      restrict access. Restriction requires explicitly dropping the
--      permissive policies — allowed ONLY after proving no existing
--      functionality depends on them + explicit owner approval.
--   3. Design decision pending (ADR 0002 review note): adopt-and-evolve the
--      existing table vs a new WinlaOS identity table. Do not guess.
-- See docs/development/supabase-verification-report.md. DO NOT apply to
-- production without explicit authorization.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'viewer'))
);

alter table public.admin_profiles enable row level security;

-- Intentionally NO anon policies: anonymous callers cannot read, insert,
-- update, or enumerate profiles.

create policy "users can read own profile"
  on public.admin_profiles for select to authenticated
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.admin_profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy for authenticated users: profile rows are created by the
-- service role during signup sync only. (Service role bypasses RLS.)

create or replace function public.prevent_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role'
     and new.role is distinct from old.role then
    raise exception 'admin_profiles.role is immutable to non-service callers';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_admin_role_change on public.admin_profiles;

create trigger trg_prevent_admin_role_change
  before update on public.admin_profiles
  for each row execute function public.prevent_admin_role_change();
