-- Winlerr Supabase live-verification pack (READ-ONLY).
--
-- Run in: Supabase dashboard → project uqdeuiaymoolyroppwhy → SQL editor.
-- Every statement below is a SELECT (or information function). Nothing here
-- creates, alters, drops, inserts, updates, or deletes anything.
-- Paste the result grids back for reconciliation against
-- docs/development/supabase-verification-report.md.
--
-- NOTE: the dashboard SQL editor runs as postgres (bypasses RLS), so these
-- results describe schema/policies — they do NOT test RLS enforcement.
-- RLS behavior must be tested via PostgREST with anon/authenticated JWTs
-- (see the staging verification plan in the report).

-- Q1. Tables in public (expect: leads, claims, admin_profiles; flag extras)
select tablename
from pg_tables
where schemaname = 'public'
order by tablename;

-- Q2. Columns of the three tables (types, nullability, defaults)
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('leads', 'claims', 'admin_profiles')
order by table_name, ordinal_position;

-- Q3. RLS enablement per table
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relname in ('leads', 'claims', 'admin_profiles');

-- Q4. All policies on the three tables (roles, commands, predicates)
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('leads', 'claims', 'admin_profiles')
order by tablename, policyname;

-- Q5. Grants to anon/authenticated on the three tables
select grantee, table_name, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('leads', 'claims', 'admin_profiles')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

-- Q6. Triggers on admin_profiles (expect: none per prior inspection)
select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'admin_profiles';

-- Q7. Definition + EXECUTE grants of the flagged security-definer function
select pg_get_functiondef(oid) as definition
from pg_proc
where proname = 'rls_auto_enable';

select grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public'
  and routine_name = 'rls_auto_enable'
order by grantee;

-- Q8. Primary keys, foreign keys, unique constraints on the three tables
select conrelid::regclass as table_name, conname as constraint_name,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in ('leads', 'claims', 'admin_profiles')
order by table_name, constraint_name;

-- Q9a. Views that read admin_profiles (would break or leak if it changes)
select table_schema, table_name as view_name
from information_schema.view_table_usage
where table_schema = 'public'
  and table_name = 'admin_profiles';

-- Q9b. Functions/triggers whose body references admin_profiles
select n.nspname as schema_name, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc ilike '%admin_profiles%';

-- Q9c. Foreign keys in OTHER tables pointing at admin_profiles
select tc.table_name as child_table, kcu.column_name as child_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_name = 'admin_profiles';
