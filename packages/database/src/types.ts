/**
 * Database types — Winlerr
 *
 * The Supabase schema source of truth is generated into `types.generated.ts`
 * from the non-production Winlerr Staging project. This file preserves the
 * small domain aliases used by the repository while deriving their shapes
 * from that generated schema.
 */

import type { Tables } from "./types.generated.js";

export type {
  CompositeTypes,
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./types.generated.js";

export type OrganizationRow = Tables<"organizations">;

export type MembershipRole = "owner" | "admin" | "member" | "viewer";

export type MembershipRow = Omit<Tables<"memberships">, "role"> & {
  role: MembershipRole;
};

export type AuditLogRow = Tables<"audit_log">;

// Convention: every organization-scoped record must have organization_id.
export type OrganizationScoped = {
  organization_id: string;
};
