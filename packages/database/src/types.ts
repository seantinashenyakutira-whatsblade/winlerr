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
  /**
   * Observed live production shape (2026-10-10, authorized inspection):
   * the table has full_name, NOT email. This type mirrors production, not
   * the unapplied migration proposal. Do not use for auth decisions until
   * the RLS review in supabase-verification-report.md is resolved.
   */
  full_name: string | null;
  role: string;
}

export interface AdminProfileInsert {
  id: string;
  full_name?: string | null;
  /** Live default is 'admin' — callers must pass role explicitly. */
  role: string;
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
    // Live DB has no enums; role is free text (see AdminProfileRow note).
    Enums: Record<string, never>;
  };
}
