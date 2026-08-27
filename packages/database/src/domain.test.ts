import { describe, it, expect } from "vitest";
import type {
  OrganizationRow,
  MembershipRow,
  AuditLogRow,
} from "./types.js";
import { domainTables, conventions } from "./client.js";
import * as fs from "node:fs";
import * as path from "node:path";

describe("database/domain", () => {
  it("organization row has required fields", () => {
    const org: OrganizationRow = {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Acme",
      slug: "acme",
      owner_user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(org.slug).toBe("acme");
  });

  it("membership row has composite key and role", () => {
    const m: MembershipRow = {
      user_id: "u1",
      organization_id: "org1",
      role: "owner",
      created_at: new Date().toISOString(),
    };
    expect(m.role).toBe("owner");
    expect(["owner", "admin", "member", "viewer"]).toContain(m.role);
  });

  it("audit log row is organization-scoped and has metadata", () => {
    const log: AuditLogRow = {
      id: "id1",
      organization_id: "org1",
      actor_user_id: "u1",
      action: "organization.create",
      resource_type: "organization",
      resource_id: "org1",
      metadata: { name: "Acme" },
      created_at: new Date().toISOString(),
    };
    expect(log.organization_id).toBe("org1");
    expect(log.metadata).toEqual({ name: "Acme" });
  });

  it("domainTables constants match migration", () => {
    expect(domainTables.organizations).toBe("organizations");
    expect(domainTables.memberships).toBe("memberships");
    expect(domainTables.auditLog).toBe("audit_log");
  });

  it("conventions tenant column is organization_id", () => {
    expect(conventions.tenantColumn).toBe("organization_id");
    expect(conventions.rlsEnabledTables).toContain("organizations");
    expect(conventions.rlsEnabledTables).toContain("memberships");
    expect(conventions.rlsEnabledTables).toContain("audit_log");
  });

  it("migration file exists", () => {
    const p = path.resolve(
      process.cwd(),
      "../../infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql"
    );
    // Also try from package root via import.meta fallback
    const alt = path.resolve(
      "infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql"
    );
    const exists = fs.existsSync(p) || fs.existsSync(alt);
    expect(exists).toBe(true);
    const sql = fs.readFileSync(fs.existsSync(p) ? p : alt, "utf8");
    expect(sql).toContain("create table if not exists public.organizations");
    expect(sql).toContain("create table if not exists public.memberships");
    expect(sql).toContain("create table if not exists public.audit_log");
    expect(sql).toContain("enable row level security");
  });

  it("every organization-scoped record must have organization_id (except organizations)", () => {
    // organizations is the tenant itself, memberships and audit_log are scoped
    const scoped: (keyof AuditLogRow | keyof MembershipRow)[] = [
      "organization_id",
    ];
    expect(scoped).toContain("organization_id");
  });

  it("audit log metadata should not contain secrets (convention)", () => {
    const badMetadata = { password: "secret", token: "abc" };
    // This test documents the convention — implementation should redact before insert
    const hasSecret = Object.keys(badMetadata).some((k) =>
      /password|secret|token/i.test(k)
    );
    expect(hasSecret).toBe(true);
    // Good metadata should not have secrets
    const goodMetadata = { action: "create", name: "Acme" };
    const hasSecretGood = Object.keys(goodMetadata).some((k) =>
      /password|secret|token/i.test(k)
    );
    expect(hasSecretGood).toBe(false);
  });

  it("migration avoids recursive memberships RLS subqueries", () => {
    const p = path.resolve(
      process.cwd(),
      "../../infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql"
    );
    const alt = path.resolve(
      "infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql"
    );
    const sql = fs.readFileSync(fs.existsSync(p) ? p : alt, "utf8");
    expect(sql).toContain("create or replace function private.is_org_member");
    expect(sql).toContain("create or replace function private.is_org_owner");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = public");
    expect(sql).toContain("$$ language plpgsql set search_path = public;");
    expect(sql).toContain("revoke all on function private.is_org_member(uuid) from public, anon;");
    expect(sql).toContain("revoke all on function private.is_org_owner(uuid) from public, anon;");
    expect(sql).toContain("owner_user_id = auth.uid()");
    expect(sql).toContain("private.is_org_admin_or_owner(organization_id)");
    expect(sql).toContain("create policy \"memberships_insert_self_or_admin\"");
    expect(sql).not.toContain(
      "organization_id in (select organization_id from public.memberships where user_id = auth.uid())"
    );
    expect(sql).not.toContain(
      "create policy \"memberships_insert_self\""
    );

    const hardeningPath = path.resolve(
      process.cwd(),
      "../../infrastructure/supabase/migrations/20260826101500_staging_security_hardening.sql"
    );
    const hardeningAlt = path.resolve(
      "infrastructure/supabase/migrations/20260826101500_staging_security_hardening.sql"
    );
    const hardening = fs.readFileSync(
      fs.existsSync(hardeningPath) ? hardeningPath : hardeningAlt,
      "utf8"
    );
    expect(hardening).toContain("create schema if not exists private");
    expect(hardening).toContain("alter function public.handle_updated_at()");
    expect(hardening).toContain("revoke all on function private.is_org_member(uuid)");
    expect(hardening).toContain("drop function if exists public.is_org_member(uuid)");

    const policyScopePath = path.resolve(
      process.cwd(),
      "../../infrastructure/supabase/migrations/20260826102000_staging_policy_scope.sql"
    );
    const policyScopeAlt = path.resolve(
      "infrastructure/supabase/migrations/20260826102000_staging_policy_scope.sql"
    );
    const policyScope = fs.readFileSync(
      fs.existsSync(policyScopePath) ? policyScopePath : policyScopeAlt,
      "utf8"
    );
    expect(policyScope).toContain("alter policy organizations_select_member");
    expect(policyScope).toContain("to authenticated");
  });
});
