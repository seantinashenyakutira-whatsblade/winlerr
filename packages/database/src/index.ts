/**
 * @winlerr/database — Supabase / PostgreSQL boundary
 *
 * Applications must import database access via this package, not via
 * direct Supabase SDK scattering. Server/client separation and
 * organization_id scoping are enforced at this boundary.
 */

export * from "./types.js";
export * from "./client.js";
