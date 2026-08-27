import type { Membership, Organization, Role, Session, User } from "./types.js";

export type AuthRuntimeCode =
  "AUTH_SESSION_ERROR" | "AUTH_USER_ERROR" | "AUTH_MEMBERSHIP_ERROR" | "AUTH_INVALID_ROLE";

export class AuthRuntimeError extends Error {
  readonly code: AuthRuntimeCode;

  constructor(code: AuthRuntimeCode, message: string) {
    super(message);
    this.name = "AuthRuntimeError";
    this.code = code;
  }
}

export interface AuthContext {
  session: Session;
  membership: Membership | null;
}

export interface ResolveAuthContextOptions {
  /** Active tenant context. Omitting it never guesses an organization. */
  organizationId?: string | null;
}

interface AuthUserRecord {
  id: string;
  email?: string | null;
  created_at?: string;
}

interface AuthSessionRecord {
  expires_at?: number | null;
}

interface AuthError {
  message: string;
}

interface MembershipRow {
  user_id: string;
  organization_id: string;
  role: string;
  created_at: string;
}

interface MembershipQuery {
  eq(column: string, value: string): MembershipQuery;
  maybeSingle(): Promise<{
    data: MembershipRow | null;
    error: AuthError | null;
  }>;
}

/**
 * Structural boundary implemented by @winlerr/database’s Supabase client.
 * Keeping this interface injected makes @winlerr/auth independent of SDK
 * construction while preventing a second database client abstraction.
 */
export interface AuthDatabaseClient {
  auth: {
    getSession(): Promise<{
      data: { session: AuthSessionRecord | null };
      error: AuthError | null;
    }>;
    getUser(): Promise<{
      data: { user: AuthUserRecord | null };
      error: AuthError | null;
    }>;
  };
  from(table: "memberships"): {
    select(columns?: string): MembershipQuery;
  };
}

const ROLES: ReadonlySet<Role> = new Set(["owner", "admin", "member", "viewer"]);

function mapUser(user: AuthUserRecord): User {
  return {
    id: user.id,
    // Supabase permits identities without email; authorization remains keyed
    // by the immutable user id rather than this display field.
    email: user.email ?? "",
    ...(user.created_at ? { createdAt: user.created_at } : {}),
  };
}

function mapMembership(row: MembershipRow): Membership {
  if (!ROLES.has(row.role as Role)) {
    throw new AuthRuntimeError(
      "AUTH_INVALID_ROLE",
      `Membership role is outside the current auth contract: ${row.role}`
    );
  }
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    role: row.role as Role,
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  };
}

/**
 * Resolve the current user using the request-scoped Supabase client.
 *
 * getSession establishes whether a request has a session; getUser asks the
 * Auth service to validate the identity. The latter is intentionally used for
 * server authorization instead of trusting decoded client-provided claims.
 */
export async function resolveAuthContext(
  client: AuthDatabaseClient,
  options: ResolveAuthContextOptions = {}
): Promise<AuthContext | null> {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    throw new AuthRuntimeError("AUTH_SESSION_ERROR", sessionError.message);
  }
  if (!sessionData.session) return null;

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw new AuthRuntimeError("AUTH_USER_ERROR", userError.message);
  }
  if (!userData.user) return null;

  const user = mapUser(userData.user);
  const organizationId = options.organizationId ?? null;
  const membership = organizationId
    ? await resolveMembership(client, user.id, organizationId)
    : null;

  return {
    session: {
      user,
      organizationId,
      membership,
      ...(sessionData.session.expires_at
        ? {
            expiresAt: new Date(sessionData.session.expires_at * 1000).toISOString(),
          }
        : {}),
    },
    membership,
  };
}

/**
 * Resolve one user/organization membership through the RLS-backed client.
 * A missing row is a normal authorization result, not an error.
 */
export async function resolveMembership(
  client: AuthDatabaseClient,
  userId: string,
  organizationId: string
): Promise<Membership | null> {
  const { data, error } = await client
    .from("memberships")
    .select("user_id, organization_id, role, created_at")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new AuthRuntimeError("AUTH_MEMBERSHIP_ERROR", error.message);
  }
  return data ? mapMembership(data) : null;
}

/** Require an authenticated user without making authorization assumptions. */
export async function requireAuthContext(
  client: AuthDatabaseClient,
  options: ResolveAuthContextOptions = {}
): Promise<AuthContext> {
  const context = await resolveAuthContext(client, options);
  if (!context) {
    throw new AuthRuntimeError("AUTH_USER_ERROR", "Authentication required");
  }
  return context;
}

/** Narrow organization records returned by the foundation schema. */
export function mapOrganization(row: {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at?: string;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerUserId: row.owner_user_id,
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  };
}
