/**
 * Database types — Winlerr
 *
 * Established for platform domain: organizations, memberships, audit_log.
 * Generated Supabase types will eventually replace manual definitions via:
 *   supabase gen types typescript --local > packages/database/src/types.generated.ts
 * For now, types are manually aligned with migration 20260824120000.
 */

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MembershipRow = {
  user_id: string;
  organization_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// Convention: every organization-scoped record must have organization_id
export type OrganizationScoped = {
  organization_id: string;
};

// Supabase Database type — used by @supabase/supabase-js when wired
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
        Insert: Omit<OrganizationRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<OrganizationRow, "id">>;
      };
      memberships: {
        Row: MembershipRow;
        Insert: MembershipRow;
        Update: Partial<Pick<MembershipRow, "role">>;
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

// Location for generated types:
// packages/database/src/types.generated.ts (after first migration, commit generated file)
