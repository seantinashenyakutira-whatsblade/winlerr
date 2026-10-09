/**
 * @winlerr/database — typed Supabase access for Winlerr.
 *
 * Entry points:
 * - `@winlerr/database/server` — anon + service-role factories (SERVER ONLY)
 * - `@winlerr/database/browser` — anon-key factory for client components
 * - `@winlerr/database` (this file) — shared table types only
 *
 * All data access is scoped by RLS; the service-role client bypasses RLS
 * and must never cross into client bundles (AGENTS.md §2).
 */
export type {
  AdminProfileInsert,
  AdminProfileRow,
  AdminRole,
  ClaimInsert,
  ClaimRow,
  Database,
  LeadInsert,
  LeadRow,
} from "./types.js";
