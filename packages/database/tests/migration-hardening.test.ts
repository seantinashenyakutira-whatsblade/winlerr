/**
 * Static safety invariants for the least-privilege hardening proposal
 * (20261011000000). These checks inspect SQL text only: they do not execute
 * PostgreSQL, validate the live catalog, or prove effective RLS/ACL behavior.
 * Staging runtime smoke tests and the read-only catalog queries in the
 * migration remain required before production deployment.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = new URL("../../../supabase/migrations/", import.meta.url);
const MIGRATION_URL = new URL("20261011000000_admin_profiles_least_privilege.sql", MIGRATIONS_DIR);
const sql = readFileSync(MIGRATION_URL, "utf8");
const lines = sql.split("\n").filter(line => !line.trim().startsWith("--"));
const code = lines.join("\n");

const DEPENDENT_TABLES = [
  "failed_submissions",
  "feature_suggestions",
  "newsletter_campaigns",
  "prototype_requests",
  "waitlist_leads",
];

const PUBLIC_INSERT_POLICIES = [
  "Anyone can insert failed_submissions",
  "Anyone can insert feature_suggestions",
  "Anyone can insert prototype_requests",
  "Anyone can insert waitlist_leads",
];

describe("least-privilege hardening proposal", () => {
  it("fails closed when required tables or RLS are absent", () => {
    expect(code).toMatch(/to_regclass\('public\.admin_profiles'\)/i);
    expect(code).toMatch(/RLS is not enabled on public\.admin_profiles/i);
    expect(code).toMatch(/expected dependent table % missing/i);
    expect(code).toMatch(/RLS is not enabled on public\.%/i);
  });

  it("requires at least one existing owner/admin profile without exposing it", () => {
    expect(code).toMatch(
      /if not exists \(\s*select 1 from public\.admin_profiles where role in \('owner', 'admin'\)\s*\) then[\s\S]*raise exception 'hardening aborted: no owner\/admin profile exists'/i
    );
    expect(sql).toMatch(/<OPERATOR_AUTH_USER_UUID>/);
    expect(sql).toMatch(/as operator_is_owner_or_admin/i);
    expect(sql).toMatch(/returns only\s+-- a boolean/i);
  });

  it("removes known superseded policies, but drops no speculative trigger/function", () => {
    expect(code).toMatch(/drop policy if exists "users can read own profile"/i);
    expect(code).toMatch(/drop policy if exists "users can update own profile"/i);
    expect(code).not.toMatch(/drop trigger/i);
    expect(code).not.toMatch(/drop function/i);
  });

  it("keeps the superseded migration out of the pending sequence", () => {
    const files = readdirSync(MIGRATIONS_DIR);
    expect(files.some(file => file.startsWith("20261010000000"))).toBe(false);
    expect(files).toContain("20261011000000_admin_profiles_least_privilege.sql");
  });

  it("creates or drops no tables and contains no data-modifying statements", () => {
    expect(code).not.toMatch(/create table/i);
    expect(code).not.toMatch(/drop table/i);
    for (const line of lines) {
      expect(line).not.toMatch(/^\s*(insert\s+into|delete\s+from|truncate)\b/i);
    }
  });

  it("drops public/anon admin_profiles policies and aborts on any remainder", () => {
    expect(code).toMatch(
      /from pg_policies[\s\S]*tablename = 'admin_profiles'[\s\S]*roles @> array\['public'\][\s\S]*roles @> array\['anon'\]/i
    );
    expect(code).toMatch(
      /select count\(\*\) into v_leftover[\s\S]*from pg_policies[\s\S]*tablename = 'admin_profiles'[\s\S]*if v_leftover > 0 then[\s\S]*unapproved admin_profiles policy remains/i
    );
    expect(code).toMatch(
      /create policy "admin_profiles_owner_select"[\s\S]*for select to authenticated[\s\S]*using \(auth\.uid\(\) = id\)/i
    );
    expect(code).not.toMatch(/for select to (public|anon)\b/i);
    expect(code).not.toMatch(/for insert to (public|anon|authenticated)\b/i);
  });

  it("gates dependent admin policies on owner/admin and excludes viewer", () => {
    expect(code).toMatch(/role\s+IN\s*\(\s*'{1,2}owner'{1,2}\s*,\s*'{1,2}admin'{1,2}\s*\)/i);
    expect(code).not.toMatch(/role\s*=\s*'{1,2}viewer'{1,2}/i);
    expect(code).not.toMatch(/IN\s*\([^)]*'{1,2}viewer'{1,2}/i);
    for (const table of DEPENDENT_TABLES) expect(code).toContain(table);
    expect(code).toMatch(/for all to authenticated/i);
  });

  it("validates and preserves only the four known public INSERT policies", () => {
    for (const policy of PUBLIC_INSERT_POLICIES) {
      expect(sql).toContain(policy);
      expect(code).not.toMatch(new RegExp(`drop policy[^;]*${policy}`, "i"));
    }
    expect(code).toMatch(/policyname ilike 'Admins can%'/i);
    expect(code).toMatch(/qual ilike '%admin_profiles%' or with_check ilike '%admin_profiles%'/i);
    expect(sql).toMatch(/There is no[\s\S]*public INSERT policy on newsletter_campaigns/i);
    expect(code).toMatch(/v_expected_policy_names := case t/i);
    expect(code).toMatch(/hardening aborted: unexpected policy set on %/i);
  });

  it("does not grant anonymous newsletter INSERT and revokes its current INSERT grant", () => {
    expect(code).toMatch(/revoke insert on public\.newsletter_campaigns from anon/i);
    expect(code).not.toMatch(/create policy[^;]*newsletter_campaigns[^;]*to (public|anon)\b/i);
    expect(code).not.toMatch(/create policy[^;]*for insert to (public|anon)\b/i);
    expect(code).toMatch(
      /tablename='newsletter_campaigns'[\s\S]*cmd='INSERT'[\s\S]*raise exception 'hardening aborted: unexpected anonymous INSERT policy/i
    );
  });

  it("revokes TRUNCATE and other unsafe privileges on every dependent table", () => {
    expect(code).toMatch(
      /revoke truncate, references, trigger, maintain\s+on public\.failed_submissions, public\.feature_suggestions,\s*public\.newsletter_campaigns, public\.prototype_requests,\s*public\.waitlist_leads\s+from authenticated/i
    );
    expect(code).toMatch(
      /revoke select, update, delete, truncate, references, trigger, maintain\s+on public\.failed_submissions, public\.feature_suggestions,\s*public\.newsletter_campaigns, public\.prototype_requests,\s*public\.waitlist_leads\s+from anon/i
    );
    expect(code).not.toMatch(
      /revoke[^;]*\b(?:select|insert|update|delete)\b[^;]*on public\.(?:failed_submissions|feature_suggestions|newsletter_campaigns|prototype_requests|waitlist_leads)[^;]*from authenticated/i
    );
    expect(code).toMatch(/revoke insert on public\.newsletter_campaigns from anon/i);
    // INSERT remains available to anon on the other four tables.
    for (const table of [
      "failed_submissions",
      "feature_suggestions",
      "prototype_requests",
      "waitlist_leads",
    ]) {
      expect(code).not.toMatch(new RegExp(`revoke[^;]*\\binsert\\b[^;]*on public\\.${table}`, "i"));
    }
  });

  it("preserves leads/claims anonymous INSERT and does not revoke service_role", () => {
    expect(code).not.toMatch(/revoke[^;]*\binsert\b[^;]*on public\.(leads|claims)/i);
    expect(code).not.toMatch(/revoke[^;]*from[^;]*service_role/i);
    expect(code).not.toMatch(/grant\s[^;]*\bto (anon|authenticated|public)\b/i);
    expect(code).not.toMatch(/revoke[^;]*\bfrom public\b/i);
  });

  it("documents read-only ACL/policy verification and runtime limits", () => {
    expect(sql).toMatch(/from pg_policies/i);
    expect(sql).toMatch(/aclexplode\(coalesce\(c\.relacl/i);
    expect(sql).toMatch(/Static tests inspect SQL text only and do not prove migration execution/i);
    expect(sql).toMatch(/Runtime smoke-test matrix/i);
  });

  it("carries the do-not-apply header and an emergency-only rollback note", () => {
    expect(sql).toMatch(/DO NOT APPLY/i);
    expect(sql).toMatch(/EMERGENCY ONLY/i);
  });
});
