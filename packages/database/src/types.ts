/**
 * Database types — Winlerr
 *
 * Placeholder for generated Supabase types.
 * When Supabase schema exists, generate via:
 *   supabase gen types typescript --local > packages/database/src/types.generated.ts
 * and re-export here.
 */

// Placeholder Database — replace with generated types when first migration ships.
// Keep empty for now to document boundary without pretending tables exist.
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

// Convention: every product table must have organization_id for tenant isolation.
// This is enforced via RLS, not just application code.
export type OrganizationScoped = {
  organization_id: string;
};

// Location for generated types:
// - packages/database/src/types.generated.ts (gitignored until first migration, then committed)
