/**
 * Static safety invariants for the least-privilege hardening proposal
 * (20261011000000). Offline checks against the tracked migration FILE —
 * they do not touch any database. They encode the review rules: the
 * proposal must only narrow access, never widen it, never touch data,
 * never assume unknown policy names, and leave the dependent tables'
 * public flows intact.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = new URL("../../../supabase/migrations/", import.meta.url);
const MIGRATION_URL = new URL(
  "20261011000000_admin_profiles_least_privilege.sql",
  MIGRATIONS_DIR,
);
const sql = readFileSync(MIGRATION_URL, "utf8");
const lines = sql.split("\n").filter((l) => !l.trim().startsWith("--"));
const code = lines.join("\n");

const DEPENDENT_TABLES = [
  "failed_submissions",
  "feature_suggestions",
  "newsletter_campaigns",
  "prototype_requests",
  "waitlist_leads",
];

describe("least-privilege hardening proposal", () => {
  it("fails closed when the table is absent", () => {
    expect(code).toMatch(/to_regclass\('public\.admin_profiles'\)/i);
    expect(code).toMatch(/raise exception/i);
  });

  it("cleans up superseded-proposal side effects by name", () => {
    expect(code).toMatch(/users can read own profile/);
    expect(code).toMatch(/users can update own profile/);
    expect(code).toMatch(/drop trigger if exists trg_prevent_admin_role_change/i);
    expect(code).toMatch(/drop function if exists public\.prevent_admin_role_change/i);
  });

  it("the superseded proposal file is gone from the deploy sequence", () => {
    const files = readdirSync(MIGRATIONS_DIR);
    expect(files.some((f) => f.startsWith("20261010000000"))).toBe(false);
    expect(files).toContain(
      "20261011000000_admin_profiles_least_privilege.sql",
    );
  });

  it("creates no tables and drops no tables", () => {
    expect(code).not.toMatch(/create table/i);
    expect(code).not.toMatch(/drop table/i);
  });

  it("contains no data-modifying statements", () => {
    for (const line of lines) {
      expect(line).not.toMatch(/^\s*(insert\s+into|delete\s+from|truncate)\b/i);
    }
  });

  it("drops permissive policies by predicate, not just by name", () => {
    expect(code).toMatch(/pg_policies/);
    expect(code).toMatch(/drop policy/i);
  });

  it("creates exactly one replacement policy on admin_profiles: owner-only SELECT for authenticated", () => {
    expect(code).toMatch(/for select to authenticated/i);
    expect(code).toMatch(/auth\.uid\(\) = id/i);
    expect(code).not.toMatch(/for select to (public|anon)\b/i);
    expect(code).not.toMatch(/for insert to (public|anon|authenticated)\b/i);
  });

  it("gates dependent admin policies on role = admin (viewer gains nothing)", () => {
    // Doubled quotes: the predicate lives inside a plpgsql string literal.
    expect(code).toMatch(/role\s*=\s*'{1,2}admin'{1,2}/i);
    for (const table of DEPENDENT_TABLES) {
      expect(code).toContain(table);
    }
    expect(code).toMatch(/for all to authenticated/i);
  });

  it("fails closed on unrecognized admin_profiles-referencing policies", () => {
    expect(code).toMatch(/unrecognized admin_profiles policy remains/i);
    expect(code).toMatch(/raise exception/i);
  });

  it("does not drop or rewrite the five tables' public flows", () => {
    // No policy/grant statement may target the dependent tables except
    // the admin-policy replacement path (which matches on the admin
    // label + admin_profiles reference, never on public submit policies).
    expect(code).not.toMatch(/revoke[^;]*on public\.(failed_submissions|feature_suggestions|newsletter_campaigns|prototype_requests|waitlist_leads)/i);
  });

  it("tightens grants: revoke list covers maintain, anon SELECT is revoked, service_role untouched", () => {
    expect(code).toMatch(/revoke[^;]*maintain[^;]*from anon, authenticated/i);
    expect(code).toMatch(/revoke select[^;]*on public\.admin_profiles from anon/i);
    expect(code).not.toMatch(/revoke[^;]*service_role/i);
    expect(code).not.toMatch(/grant\s[^;]*\bto (anon|authenticated|public)\b/i);
  });

  it("leaves the event trigger helper alone", () => {
    expect(code).not.toMatch(/rls_auto_enable|ensure_rls/i);
  });

  it("carries the do-not-apply header and a non-routine rollback note", () => {
    expect(sql).toMatch(/DO NOT APPLY/i);
    expect(sql).toMatch(/EMERGENCY ONLY/i);
  });
});
