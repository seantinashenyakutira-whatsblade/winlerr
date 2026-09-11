import { describe, expect, it, vi } from "vitest";
import {
  requireAuthContext,
  resolveAuthContext,
  resolveMembership,
  type AuthDatabaseClient,
} from "./runtime.js";

type MembershipData = {
  user_id: string;
  organization_id: string;
  role: string;
  created_at: string;
};

type MembershipResponse = {
  data: MembershipData | null;
  error: { message: string } | null;
};

function makeClient(overrides: Partial<AuthDatabaseClient> = {}) {
  const getSession = vi.fn(async () => ({
    data: { session: { expires_at: 1_800_000_000 } },
    error: null,
  }));
  const getUser = vi.fn(async () => ({
    data: {
      user: {
        id: "user-a",
        email: "a@example.test",
        created_at: "2026-08-26T00:00:00.000Z",
      },
    },
    error: null,
  }));
  const maybeSingle = vi.fn<() => Promise<MembershipResponse>>(async () => ({
    data: {
      user_id: "user-a",
      organization_id: "org-a",
      role: "member",
      created_at: "2026-08-26T00:00:00.000Z",
    },
    error: null,
  }));
  const eq = vi.fn(() => filteredQuery);
  const filteredQuery = { eq, maybeSingle };
  const select = vi.fn(() => filteredQuery);
  const membershipQuery = { select };
  const client: AuthDatabaseClient = {
    auth: { getSession, getUser },
    from: vi.fn(() => membershipQuery),
    ...overrides,
  };
  return {
    client,
    getSession,
    getUser,
    from: client.from,
    select,
    eq,
    maybeSingle,
    membershipQuery: filteredQuery,
  };
}

describe("auth/runtime", () => {
  it("returns null for an unauthenticated request without resolving a user", async () => {
    const { client, getUser } = makeClient();
    client.auth.getSession = vi.fn(async () => ({
      data: { session: null },
      error: null,
    }));

    await expect(resolveAuthContext(client)).resolves.toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("resolves a trusted user and only the requested organization membership", async () => {
    const { client, from, select, eq, maybeSingle } = makeClient();

    const result = await resolveAuthContext(client, { organizationId: "org-a" });

    expect(result?.session.user).toMatchObject({
      id: "user-a",
      email: "a@example.test",
    });
    expect(result?.membership).toMatchObject({
      userId: "user-a",
      organizationId: "org-a",
      role: "member",
    });
    expect(from).toHaveBeenCalledWith("memberships");
    expect(select).toHaveBeenCalledWith("user_id, organization_id, role, created_at");
    expect(eq).toHaveBeenNthCalledWith(1, "user_id", "user-a");
    expect(eq).toHaveBeenNthCalledWith(2, "organization_id", "org-a");
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it("does not guess an organization when no context is supplied", async () => {
    const { client, from } = makeClient();

    const result = await resolveAuthContext(client);

    expect(result?.session.organizationId).toBeNull();
    expect(result?.membership).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("treats an absent membership as an authorization miss", async () => {
    const { client, membershipQuery } = makeClient();
    membershipQuery.maybeSingle = vi.fn(async () => ({
      data: null,
      error: null,
    }));

    await expect(resolveMembership(client, "user-a", "org-b")).resolves.toBeNull();
  });

  it("translates membership query errors into a typed auth runtime error", async () => {
    const { client, membershipQuery } = makeClient();
    membershipQuery.maybeSingle = vi.fn(async () => ({
      data: null,
      error: { message: "row lookup failed" },
    }));

    await expect(resolveMembership(client, "user-a", "org-a")).rejects.toMatchObject({
      code: "AUTH_MEMBERSHIP_ERROR",
      message: "row lookup failed",
    });
  });

  it("requires an authenticated context explicitly", async () => {
    const { client } = makeClient({
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
    });

    await expect(requireAuthContext(client)).rejects.toMatchObject({
      code: "AUTH_USER_ERROR",
      message: "Authentication required",
    });
  });
});
