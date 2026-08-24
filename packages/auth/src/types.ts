/**
 * Auth contract — Winlerr
 *
 * Distinguishes Authentication (who you are) from Authorization (what you can do).
 *
 * Authentication: Supabase Auth proves identity (user id, email, session).
 * Authorization: Membership + Role + Permission proves access to an organization.
 *
 * Final role/permission matrix remains HQ/Product decision (see ADR 0004).
 * This contract defines the shape, not the final policy.
 */

/**
 * Identity — who the user is (AuthN)
 * Maps to Supabase auth.users
 */
export interface User {
  id: string;
  email: string;
  createdAt?: string;
}

/**
 * Organization — tenant (business/client)
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  createdAt?: string;
}

/**
 * Role — placeholder set. Final matrix is HQ decision.
 * Listed here to establish shape, not to freeze policy.
 */
export type Role = "owner" | "admin" | "member" | "viewer";

/**
 * Permission — resource:action
 * Examples: "lead:read", "booking:write", "org:admin"
 * Final per-product permissions are HQ decision — keep open.
 */
export type Permission = `${string}:${string}`;

/**
 * Membership — user ↔ organization + role (AuthZ)
 * Primary key: (userId, organizationId)
 */
export interface Membership {
  userId: string;
  organizationId: string;
  role: Role;
  createdAt?: string;
}

/**
 * Session / Identity — authenticated user + active organization context
 */
export interface Session {
  user: User;
  organizationId?: string | null;
  membership?: Membership | null;
  expiresAt?: string;
}

/**
 * Permission check result (pure)
 */
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}
