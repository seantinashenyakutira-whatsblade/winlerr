/**
 * Static safety invariants for the admin_profiles migration proposal.
 *
 * These tests run offline against the tracked migration FILE — they do not
 * touch any database. They encode the review rules from
 * docs/development/supabase-verification-report.md so a future edit that
 * introduces a destructive or data-touching statement fails loudly here.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATION_URL = new URL(
  "../../../supabase/migrations/20261010000000_create_admin_profiles_table.sql",
  import.meta.url,
);
const sql = readFileSync(MIGRATION_URL, "utf8");
const lines = sql.split("\n").filter((l) => !l.trim().startsWith("--"));
const code = lines.join("\n");

describe("admin_profiles migration proposal", () => {
  it("is idempotent on the table (IF NOT EXISTS, no DROP TABLE)", () => {
    expect(sql).toMatch(/create table if not exists/i);
    expect(sql).not.toMatch(/drop table/i);
  });

  it("contains no data-modifying statements", () => {
    // Legitimate occurrences of these words live in comments (stripped
    // above), policy clauses, and trigger bodies — assert on statement
    // starts instead of substrings.
    for (const line of lines) {
      expect(line).not.toMatch(/^\s*(insert\s+into|delete\s+from|truncate)\b/i);
    }
  });

  it("enables RLS on the table", () => {
    expect(sql).toMatch(/enable row level security/i);
  });

  it("grants nothing to anon (no public read/insert smuggled in)", () => {
    expect(code).not.toMatch(/to\s+anon\b/i);
    expect(code).not.toMatch(/to\s+public\b/i);
  });

  it("keeps the role-immutability trigger wired to the service-role claim", () => {
    expect(sql).toMatch(/prevent_admin_role_change/);
    expect(sql).toMatch(/service_role/);
  });

  it("carries the do-not-apply + reconciliation header", () => {
    expect(sql).toMatch(/DO NOT APPLY/i);
    expect(sql).toMatch(/supabase-verification-report\.md/);
  });
});
