import { afterEach, describe, expect, it } from "vitest";
import {
  assertStagingTarget,
  buildFixture,
  sqlLiteral,
  TARGET_PROJECT_REF,
  TARGET_URL,
} from "./phase6-staging-fixture.mjs";

afterEach(() => {
  delete process.env.WINLERR_STAGING_PROJECT_REF;
  delete process.env.WINLERR_STAGING_SUPABASE_URL;
});

describe("Phase 6 staging fixture generator", () => {
  it("fails closed for any project other than the approved staging ref", () => {
    process.env.WINLERR_STAGING_PROJECT_REF = "not-production";
    expect(() => assertStagingTarget()).toThrow(/project ref mismatch/);
  });

  it("accepts only the exact approved staging target", () => {
    process.env.WINLERR_STAGING_PROJECT_REF = TARGET_PROJECT_REF;
    process.env.WINLERR_STAGING_SUPABASE_URL = TARGET_URL;
    expect(() => assertStagingTarget()).not.toThrow();
  });

  it("generates two tenants and all four authorization roles", () => {
    const fixture = buildFixture();
    expect(fixture.projectRef).toBe(TARGET_PROJECT_REF);
    expect(Object.keys(fixture.organizations)).toEqual(["tenantA", "tenantB"]);
    expect(fixture.roles).toEqual(["owner", "admin", "member", "viewer"]);
    expect(Object.keys(fixture.users)).toEqual(["owner", "admin", "member", "viewer", "tenantB"]);
    expect(fixture.setupSql).toContain("insert into auth.users");
    expect(fixture.setupSql).toContain("insert into auth.identities");
    expect(fixture.setupSql).toContain("insert into public.organizations");
    expect(fixture.setupSql).toContain("select 1 as setup_requested limit 1");
  });

  it("quotes SQL literals and does not embed plaintext fixture passwords", () => {
    expect(sqlLiteral("a'b")).toBe("'a''b'");
    const fixture = buildFixture();
    expect(fixture.setupSql).not.toMatch(/Phase6-[0-9a-f-]+-Aa1!/);
    expect(fixture.setupSql).toContain("crypt('Phase6-' ||");
  });
});
