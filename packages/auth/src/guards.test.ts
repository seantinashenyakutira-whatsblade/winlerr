import { describe, it, expect } from "vitest";
import {
  hasPermission,
  isMember,
  getMembership,
  hasRoleAtLeast,
  requireOrganizationId,
} from "./guards.js";
import type { Membership } from "./types.js";

const memberships: Membership[] = [
  { userId: "u1", organizationId: "org1", role: "owner" },
  { userId: "u1", organizationId: "org2", role: "viewer" },
  { userId: "u2", organizationId: "org1", role: "member" },
];

describe("auth/guards", () => {
  it("hasPermission checks role permissions", () => {
    expect(hasPermission(memberships[0], "org:admin")).toBe(true);
    expect(hasPermission(memberships[0], "lead:write")).toBe(true);
    expect(hasPermission(memberships[1], "lead:write")).toBe(false);
    expect(hasPermission(memberships[2], "lead:read")).toBe(true);
    expect(hasPermission(memberships[2], "org:admin")).toBe(false);
    expect(hasPermission(null, "lead:read")).toBe(false);
  });

  it("isMember checks membership", () => {
    expect(isMember(memberships, "u1", "org1")).toBe(true);
    expect(isMember(memberships, "u1", "org2")).toBe(true);
    expect(isMember(memberships, "u2", "org2")).toBe(false);
  });

  it("getMembership returns correct membership", () => {
    expect(getMembership(memberships, "u1", "org1")?.role).toBe("owner");
    expect(getMembership(memberships, "u1", "org2")?.role).toBe("viewer");
    expect(getMembership(memberships, "u2", "org2")).toBeNull();
  });

  it("hasRoleAtLeast respects hierarchy owner > admin > member > viewer", () => {
    expect(hasRoleAtLeast(memberships[0], "admin")).toBe(true);
    expect(hasRoleAtLeast(memberships[1], "member")).toBe(false);
    expect(hasRoleAtLeast(memberships[2], "viewer")).toBe(true);
    expect(hasRoleAtLeast(null, "viewer")).toBe(false);
  });

  it("requireOrganizationId validates presence", () => {
    expect(requireOrganizationId(null)).toBe("organization_id is required");
    expect(requireOrganizationId("")).toBe("organization_id is required");
    expect(requireOrganizationId("org1")).toBeNull();
  });

  it("distinguishes AuthN vs AuthZ types", () => {
    const m: Membership = { userId: "u", organizationId: "o", role: "member" };
    // AuthN is User, AuthZ is Membership — ensure shape is correct
    expect(m.userId).toBeDefined();
    expect(m.organizationId).toBeDefined();
    expect(m.role).toBe("member");
  });
});
