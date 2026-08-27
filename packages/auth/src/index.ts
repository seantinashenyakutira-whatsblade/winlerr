/**
 * @winlerr/auth — authentication & authorization contract
 *
 * Authentication (who you are) = Supabase Auth (user, session)
 * Authorization (what you can do) = Membership + Role + Permission + RLS
 *
 * This package provides typed interfaces, pure utilities, and the single
 * request-scoped runtime resolver built on @winlerr/database.
 * Final role/permission matrix is HQ/Product decision.
 */

export * from "./types.js";
export * from "./guards.js";
export * from "./runtime.js";
