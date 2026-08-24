import type { Membership, Permission, Role } from "./types.js";

/**
 * Pure authorization utilities — no DB, no Supabase, no side effects.
 * Used by Route Handlers / services to check membership before DB access.
 * RLS is the final enforcement layer; these are defense-in-depth.
 */

// Placeholder permission map — illustrates shape, not final policy.
// HQ/Product will define per-product permissions. Keep minimal here.
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["org:admin", "lead:read", "lead:write", "booking:read", "booking:write"],
  admin: ["lead:read", "lead:write", "booking:read", "booking:write"],
  member: ["lead:read", "lead:write", "booking:read"],
  viewer: ["lead:read", "booking:read"],
};

/**
 * Check if membership has a specific permission (pure).
 */
export function hasPermission(
  membership: Membership | null | undefined,
  permission: Permission
): boolean {
  if (!membership) return false;
  const perms = ROLE_PERMISSIONS[membership.role] ?? [];
  return perms.includes(permission);
}

/**
 * Check if user is member of organization.
 */
export function isMember(
  memberships: Membership[],
  userId: string,
  organizationId: string
): boolean {
  return memberships.some(
    (m) => m.userId === userId && m.organizationId === organizationId
  );
}

/**
 * Get membership for user in organization.
 */
export function getMembership(
  memberships: Membership[],
  userId: string,
  organizationId: string
): Membership | null {
  return (
    memberships.find(
      (m) => m.userId === userId && m.organizationId === organizationId
    ) ?? null
  );
}

/**
 * Check if role is at least a given level (owner > admin > member > viewer).
 */
const ROLE_RANK: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasRoleAtLeast(
  membership: Membership | null | undefined,
  minimumRole: Role
): boolean {
  if (!membership) return false;
  return (ROLE_RANK[membership.role] ?? 0) >= (ROLE_RANK[minimumRole] ?? 0);
}

/**
 * Validate that session has organization context — helper for org-scoped handlers.
 * Returns error message if missing, null if ok.
 */
export function requireOrganizationId(
  organizationId: string | null | undefined
): string | null {
  if (!organizationId) return "organization_id is required";
  return null;
}
