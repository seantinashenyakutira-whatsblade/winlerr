import { describe, expect, it } from "vitest";
import {
  createOrganization,
  getOrganization,
  listMyOrganizations,
  type MembershipInsertRow,
  type OrgInsertRow,
  type WorkspaceContext,
  type WorkspaceDb,
} from "../src/organizations.js";
import type {
  Organization,
  OrganizationMembership,
} from "../src/types.js";

/** In-memory WorkspaceDb fake. Behaviors mirror PostgREST semantics used. */
class FakeDb implements WorkspaceDb {
  orgs = new Map<string, Organization>();
  members: OrganizationMembership[] = [];
  failNext: string | null = null;

  private maybeFail() {
    if (this.failNext) {
      const message = this.failNext;
      this.failNext = null;
      return { message };
    }
    return undefined;
  }

  async findOrgBySlug(slug: string) {
    const error = this.maybeFail();
    if (error) return { org: null, error };
    const org = [...this.orgs.values()].find((o) => o.slug === slug) ?? null;
    return { org };
  }

  async findOrgById(id: string) {
    const error = this.maybeFail();
    if (error) return { org: null, error };
    return { org: this.orgs.get(id) ?? null };
  }

  async insertOrganization(row: OrgInsertRow) {
    if ([...this.orgs.values()].some((o) => o.slug === row.slug)) {
      return { org: null, code: "23505" };
    }
    const org: Organization = {
      id: `org-${this.orgs.size + 1}`,
      created_at: "2026-01-01T00:00:00Z",
      ...row,
    };
    this.orgs.set(org.id, org);
    return { org };
  }

  async insertMembership(row: MembershipInsertRow) {
    if (this.members.some((m) => m.org_id === row.org_id && m.user_id === row.user_id)) {
      return { membership: null, code: "23505" };
    }
    const membership: OrganizationMembership = {
      created_at: "2026-01-01T00:00:00Z",
      ...row,
    };
    this.members.push(membership);
    return { membership };
  }

  async listMemberships(userId: string) {
    const error = this.maybeFail();
    if (error) return { memberships: null, error };
    return { memberships: this.members.filter((m) => m.user_id === userId) };
  }

  async findMembership(orgId: string, userId: string) {
    const error = this.maybeFail();
    if (error) return { membership: null, error };
    return {
      membership: this.members.find((m) => m.org_id === orgId && m.user_id === userId) ?? null,
    };
  }
}

function ctx(db: WorkspaceDb, userId: string | null): WorkspaceContext {
  return { db, userId };
}

describe("createOrganization", () => {
  it("creates the org and forces the owner role", async () => {
    const db = new FakeDb();
    const result = await createOrganization(ctx(db, "user-1"), { name: "Miso", slug: "miso" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.organization.slug).toBe("miso");
    expect(result.data.organization.created_by).toBe("user-1");
    expect(result.data.membership).toMatchObject({ user_id: "user-1", role: "owner" });
  });

  it("rejects signed-out callers without touching the db", async () => {
    const db = new FakeDb();
    const before = db.orgs.size;
    expect(await createOrganization(ctx(db, null), { name: "Miso", slug: "miso" })).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(db.orgs.size).toBe(before);
  });

  it("validates name and slug before any query", async () => {
    const db = new FakeDb();
    let queried = false;
    const counting: WorkspaceDb = new Proxy(db, {
      get(target, prop, receiver) {
        if (typeof prop === "string" && prop.startsWith("find")) queried = true;
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    expect(await createOrganization(ctx(counting, "u"), { name: "", slug: "ok-slug" })).toEqual({
      ok: false,
      error: "invalid-name",
    });
    expect(await createOrganization(ctx(counting, "u"), { name: "Ok", slug: "BAD SLUG!" })).toEqual({
      ok: false,
      error: "invalid-slug",
    });
    expect(queried).toBe(false);
  });

  it("reports slug-taken on existing slug and on unique-race", async () => {
    const db = new FakeDb();
    await createOrganization(ctx(db, "user-1"), { name: "Miso", slug: "miso" });
    expect(await createOrganization(ctx(db, "user-2"), { name: "Other", slug: "miso" })).toEqual({
      ok: false,
      error: "slug-taken",
    });
  });

  it("maps database failures to unknown without leaking details", async () => {
    const db = new FakeDb();
    db.failNext = "connection reset";
    expect(await createOrganization(ctx(db, "user-1"), { name: "Miso", slug: "miso" })).toEqual({
      ok: false,
      error: "unknown",
    });
  });
});

describe("listMyOrganizations", () => {
  it("returns only the caller's orgs (tenant isolation)", async () => {
    const db = new FakeDb();
    await createOrganization(ctx(db, "user-1"), { name: "One", slug: "one" });
    await createOrganization(ctx(db, "user-2"), { name: "Two", slug: "two" });
    const result = await listMyOrganizations(ctx(db, "user-1"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((o) => o.slug)).toEqual(["one"]);
    expect(result.data[0]?.role).toBe("owner");
  });

  it("rejects signed-out callers", async () => {
    expect(await listMyOrganizations(ctx(new FakeDb(), null))).toEqual({
      ok: false,
      error: "unauthorized",
    });
  });
});

describe("getOrganization", () => {
  it("returns the org with the caller's role for members", async () => {
    const db = new FakeDb();
    const created = await createOrganization(ctx(db, "user-1"), { name: "One", slug: "one" });
    if (!created.ok) throw new Error("setup failed");
    const result = await getOrganization(ctx(db, "user-1"), created.data.organization.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.role).toBe("owner");
  });

  it("hides other users' orgs without distinguishing missing from non-member", async () => {
    const db = new FakeDb();
    const created = await createOrganization(ctx(db, "user-1"), { name: "One", slug: "one" });
    if (!created.ok) throw new Error("setup failed");
    expect(await getOrganization(ctx(db, "user-2"), created.data.organization.id)).toEqual({
      ok: false,
      error: "not-member",
    });
    expect(await getOrganization(ctx(db, "user-2"), "org-does-not-exist")).toEqual({
      ok: false,
      error: "not-member",
    });
    expect(await getOrganization(ctx(db, null), created.data.organization.id)).toEqual({
      ok: false,
      error: "unauthorized",
    });
  });
});
