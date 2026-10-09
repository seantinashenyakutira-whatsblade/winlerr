/**
 * @winlerr/database — manually maintained table types.
 *
 * These mirror `supabase/migrations/*` exactly (leads, claims) plus the
 * WinlaOS core tables. They are a stopgap until `supabase gen types` can run
 * against a real project — see docs/decisions/0002-winlaos-core-auth-data.md.
 * When generated types land, delete this file's table definitions and import
 * the generated `Database` instead.
 */

export type AdminRole = "owner" | "admin" | "viewer";

export interface LeadRow {
  id: string;
  created_at: string;
  name: string;
  business_name: string | null;
  whatsapp: string | null;
  email: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
}

export interface LeadInsert {
  id?: string;
  name: string;
  business_name?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ClaimRow {
  id: string;
  business_name: string;
  slug: string;
  email: string;
  whatsapp: string | null;
  status: string;
  metadata: Record<string, unknown>;
}

export interface ClaimInsert {
  id: string;
  business_name: string;
  slug: string;
  email: string;
  whatsapp?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminProfileRow {
  id: string;
  created_at: string;
  email: string | null;
  role: AdminRole;
}

export interface AdminProfileInsert {
  id: string;
  email?: string | null;
  role?: AdminRole;
}

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
        Relationships: [];
      };
      claims: {
        Row: ClaimRow;
        Insert: ClaimInsert;
        Update: Partial<ClaimInsert>;
        Relationships: [];
      };
      admin_profiles: {
        Row: AdminProfileRow;
        Insert: AdminProfileInsert;
        Update: Partial<AdminProfileInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      admin_role: AdminRole;
    };
  };
}
