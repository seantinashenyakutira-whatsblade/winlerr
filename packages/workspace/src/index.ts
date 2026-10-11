/**
 * @winlerr/workspace — organization and membership foundation for WinlerrOS.
 *
 * Framework-free core (types, validation, lifecycle). The production
 * PostgREST adapter lives in the app's server actions; organization/role
 * reads beyond this package are blocked until the security migrations
 * land (see the workspace integration contract).
 */
export type {
  Organization,
  OrganizationMembership,
  OrganizationRole,
  OrganizationWithRole,
  WorkspaceErrorCode,
  WorkspaceResult,
} from "./types.js";
export { WORKSPACE_ERROR_COPY } from "./types.js";
export {
  createOrganizationSchema,
  organizationNameSchema,
  organizationSlugSchema,
  type CreateOrganizationInput,
} from "./validation.js";
export {
  createOrganization,
  getOrganization,
  listMyOrganizations,
  type DbCallError,
  type MembershipInsertRow,
  type OrgInsertRow,
  type WorkspaceContext,
  type WorkspaceDb,
} from "./organizations.js";
