/**
 * @winlerr/database/server — server-side Supabase factories.
 *
 * SERVER ONLY. Never import this module (or `SUPABASE_SERVICE_ROLE_KEY`)
 * from client components — see AGENTS.md §2. Route handlers and server
 * components import from `@winlerr/database/server`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[database] missing required environment variable ${name}`,
    );
  }
  return value;
}

/**
 * Anon-key client for server-side use (route handlers, server components).
 * Uses the same options as the existing API routes: no session persistence,
 * no token refresh — each request is stateless. RLS applies: anon can only
 * INSERT into `leads`/`claims` (no SELECT policy exists by design).
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client. Bypasses RLS — for privileged server-side work only
 * (profile sync on signup, admin operations, claim-to-account linking).
 * Throws when the key is absent so misconfiguration fails loudly at the
 * call site instead of silently degrading to anon privileges.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
