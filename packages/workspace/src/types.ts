/**
 * @winlerr/workspace — organization model types.
 *
 * Framework-free. Roles: 'owner' (full control, first creator), 'admin'
 * (granted later via service-role invites — no normal-role path exists
 * yet), 'member' (belongs, no management rights). Viewer-style read-only
 * roles are out of scope until product defines them.
 */

export type OrganizationRole = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  created_by: string;
}

export interface OrganizationMembership {
  org_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
}

export interface OrganizationWithRole extends Organization {
  role: OrganizationRole;
}

export type WorkspaceErrorCode =
  | "unauthorized"
  | "invalid-name"
  | "invalid-slug"
  | "slug-taken"
  | "already-member"
  | "not-member"
  | "not-found"
  | "forbidden"
  | "unknown";

export type WorkspaceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WorkspaceErrorCode };

export const WORKSPACE_ERROR_COPY: Record<WorkspaceErrorCode, string> = {
  unauthorized: "You need to sign in to continue.",
  "invalid-name": "Give your workspace a name between 1 and 120 characters.",
  "invalid-slug": "Use lowercase letters, numbers, and hyphens for the workspace address.",
  "slug-taken": "That workspace address is already taken. Try another.",
  "already-member": "You already belong to this workspace.",
  "not-member": "You do not belong to this workspace.",
  "not-found": "Workspace not found.",
  forbidden: "You do not have permission for that action.",
  unknown: "Something went wrong. Please try again.",
};
