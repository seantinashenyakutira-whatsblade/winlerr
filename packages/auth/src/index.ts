/**
 * @winlerr/auth — authentication & authorization contract
 *
 * Authentication (who you are) = Supabase Auth (user, session)
 * Authorization (what you can do) = Membership + Role + Permission + RLS
 *
 * This package provides typed interfaces and pure utilities.
 * No production auth flow, no OAuth, no Supabase connection here.
 * Final role/permission matrix is HQ/Product decision.
 */

export * from "./types.js";
export * from "./guards.js";
