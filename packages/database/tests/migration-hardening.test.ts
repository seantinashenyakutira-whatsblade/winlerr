/**
 * Static safety invariants for the least-privilege hardening proposal
 * (20261011000000). Offline checks against the tracked migration FILE —
 * they do not touch any database. They encode the review rules: the
 * proposal must only narrow access, never widen it, never touch data,
 * and never assume policy names except our own superseded proposal.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATION_URL = new URL(
  "../../../supabase/migrations/20261011000000_admin_profiles_least_privilege.sql",
  import.meta.url,
);
const sql = readFileSync(MIGRATION_URL, "utf8");
const lines = sql.split("\n").filter((l) => !l.trim().startsWith("--"));
const code = lines.join("\n");

describe("least-privilege hardening proposal", () => {
  it("fails closed when the table is absent", () => {
    expect(code).toMatch(/to_regclass\('public\.admin_profiles'\)/i);
    expect(code).toMatch(/raise exception/i);
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

  it("creates exactly one replacement policy: owner-only SELECT for authenticated", () => {
    expect(code).toMatch(/for select to authenticated/i);
    expect(code).toMatch(/auth\.uid\(\) = id/i);
    expect(code).not.toMatch(/for select to (public|anon)\b/i);
    expect(code).not.toMatch(/for insert to (public|anon|authenticated)\b/i);
  });

  it("grants nothing new to anon; revokes write-ish privileges", () => {
    expect(code).toMatch(/revoke/i);
    expect(code).not.toMatch(/grant\s+(?!.*\bto service_role\b).*\bon\b.*\bto (anon|authenticated|public)\b/i);
  });

  it("leaves service_role and the event trigger alone", () => {
    expect(code).not.toMatch(/revoke.*service_role/i);
    expect(code).not.toMatch(/rls_auto_enable|ensure_rls/i);
  });

  it("does not touch the five dependent tables' policies", () => {
    for (const table of [
      "failed_submissions",
      "feature_suggestions",
      "newsletter_campaigns",
      "prototype_requests",
      "waitlist_leads",
    ]) {
      expect(code).not.toMatch(
        new RegExp(`(drop policy|create policy)[^;]*on public\\.${table}`, "i"),
      );
      expect(code).not.toMatch(
        new RegExp(`revoke[^;]*on public\\.${table}`, "i"),
      );
    }
  });

  it("carries the do-not-apply header and a non-routine rollback note", () => {
    expect(sql).toMatch(/DO NOT APPLY/i);
    expect(sql).toMatch(/EMERGENCY ONLY/i);
  });
});
