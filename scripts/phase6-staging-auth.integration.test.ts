import { beforeAll, describe, expect, it } from "vitest";
import { createServerClient, type DatabaseClient } from "../packages/database/src/client.ts";
import { resolveAuthContext, type AuthContext } from "../packages/auth/src/runtime.ts";
import { readFile } from "node:fs/promises";

const projectRef = process.env.WINLERR_STAGING_PROJECT_REF;
const supabaseUrl = process.env.WINLERR_STAGING_SUPABASE_URL;
const supabaseKey = process.env.WINLERR_STAGING_SUPABASE_KEY;
const manifestPath =
  process.env.WINLERR_PHASE6_FIXTURE_MANIFEST ?? "/tmp/winlerr_phase6_fixture_manifest.json";

if (projectRef !== "xvwgumawzoqjduvtnlcs") {
  throw new Error("Phase 6 integration test refused: staging project ref mismatch");
}
if (supabaseUrl !== "https://xvwgumawzoqjduvtnlcs.supabase.co") {
  throw new Error("Phase 6 integration test refused: staging URL mismatch");
}
if (!supabaseKey) {
  throw new Error("Phase 6 integration test requires a runtime publishable key");
}

const validatedSupabaseUrl = supabaseUrl as string;
const validatedSupabaseKey = supabaseKey as string;

interface FixtureManifest {
  projectRef: string;
  supabaseUrl: string;
  organizations: { tenantA: string; tenantB: string };
  users: Record<string, { id: string; email: string }>;
}

let fixture: FixtureManifest;
const clients = new Map<string, DatabaseClient>();
const contexts = new Map<string, AuthContext>();

async function signIn(role: string): Promise<DatabaseClient> {
  const existing = clients.get(role);
  if (existing) return existing;
  const identity = fixture.users[role];
  if (!identity) throw new Error(`Missing fixture identity for role ${role}`);
  const client = createServerClient({
    supabaseUrl: validatedSupabaseUrl,
    supabaseKey: validatedSupabaseKey,
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: identity.email,
    password: `Phase6-${identity.id}`,
  });
  if (error || !data.session) {
    throw new Error(`Fixture sign-in failed for role ${role}`);
  }
  clients.set(role, client);
  return client;
}

async function contextFor(role: string, organizationId: string): Promise<AuthContext> {
  const cacheKey = `${role}:${organizationId}`;
  const existing = contexts.get(cacheKey);
  if (existing) return existing;
  const context = await resolveAuthContext(await signIn(role), { organizationId });
  if (!context) throw new Error(`No auth context for role ${role}`);
  contexts.set(cacheKey, context);
  return context;
}

beforeAll(async () => {
  fixture = JSON.parse(await readFile(manifestPath, "utf8")) as FixtureManifest;
  if (fixture.projectRef !== projectRef || fixture.supabaseUrl !== supabaseUrl) {
    throw new Error("Phase 6 integration test refused: fixture target mismatch");
  }
});

describe("Phase 6 staging Auth, membership, and RLS runtime", () => {
  it("handles an unauthenticated foundation query safely", async () => {
    const client = createServerClient({
      supabaseUrl: validatedSupabaseUrl,
      supabaseKey: validatedSupabaseKey,
    });
    const { data, error } = await client.from("organizations").select("id, slug");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("resolves all four organization-A roles through Auth and membership", async () => {
    for (const role of ["owner", "admin", "member", "viewer"] as const) {
      const context = await contextFor(role, fixture.organizations.tenantA);
      expect(context.session.user.id).toBe(fixture.users[role]?.id);
      expect(context.membership).toMatchObject({
        userId: fixture.users[role]?.id,
        organizationId: fixture.organizations.tenantA,
        role,
      });
    }
  });

  it("resolves tenant-B owner only in tenant B", async () => {
    const context = await contextFor("tenantB", fixture.organizations.tenantB);
    expect(context.membership).toMatchObject({
      userId: fixture.users.tenantB?.id,
      organizationId: fixture.organizations.tenantB,
      role: "owner",
    });
  });

  it("enforces organization isolation on authenticated reads", async () => {
    const orgAClient = await signIn("member");
    const orgBClient = await signIn("tenantB");
    const [aResult, bResult] = await Promise.all([
      orgAClient.from("organizations").select("id, slug"),
      orgBClient.from("organizations").select("id, slug"),
    ]);

    expect(aResult.error).toBeNull();
    expect(bResult.error).toBeNull();
    expect(aResult.data?.map(row => row.id)).toEqual([fixture.organizations.tenantA]);
    expect(bResult.data?.map(row => row.id)).toEqual([fixture.organizations.tenantB]);

    const crossTenantMembership = await orgBClient
      .from("memberships")
      .select("user_id, organization_id")
      .eq("organization_id", fixture.organizations.tenantA);
    expect(crossTenantMembership.error).toBeNull();
    expect(crossTenantMembership.data).toEqual([]);
  });

  it("denies cross-tenant organization updates and audit writes", async () => {
    const tenantBClient = await signIn("tenantB");
    const updateResult = await tenantBClient
      .from("organizations")
      .update({ name: "must-not-update" })
      .eq("id", fixture.organizations.tenantA)
      .select("id");
    expect(updateResult.error).toBeNull();
    expect(updateResult.data).toEqual([]);

    const auditResult = await tenantBClient.from("audit_log").insert({
      organization_id: fixture.organizations.tenantA,
      actor_user_id: fixture.users.tenantB?.id,
      action: "phase6_cross_tenant_write",
      resource_type: "foundation_test",
    });
    expect(auditResult.error).not.toBeNull();
  });

  it("allows a member’s own audit entry while preserving actor scoping", async () => {
    const memberClient = await signIn("member");
    const result = await memberClient.from("audit_log").insert({
      organization_id: fixture.organizations.tenantA,
      actor_user_id: fixture.users.member?.id,
      action: "phase6_member_audit",
      resource_type: "foundation_test",
    });
    expect(result.error).toBeNull();

    const crossActorResult = await memberClient.from("audit_log").insert({
      organization_id: fixture.organizations.tenantA,
      actor_user_id: fixture.users.tenantB?.id,
      action: "phase6_invalid_actor",
      resource_type: "foundation_test",
    });
    expect(crossActorResult.error).not.toBeNull();
  });

  it("denies membership creation to member and viewer roles", async () => {
    for (const role of ["member", "viewer"] as const) {
      const result = await (await signIn(role)).from("memberships").insert({
        user_id: fixture.users.tenantB?.id,
        organization_id: fixture.organizations.tenantA,
        role: "viewer",
      });
      expect(result.error).not.toBeNull();
    }
  });

  it("allows the admin role to create the disposable cross-tenant membership", async () => {
    const result = await (await signIn("admin")).from("memberships").insert({
      user_id: fixture.users.tenantB?.id,
      organization_id: fixture.organizations.tenantA,
      role: "viewer",
    });
    expect(result.error).toBeNull();
  });
});
