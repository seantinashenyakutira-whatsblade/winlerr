/**
 * @winlerr/database/browser — browser-side Supabase factory.
 *
 * Uses the anon key only. RLS applies: from the browser, callers can only
 * do what anon policies allow (today: INSERT into `leads`/`claims`).
 * Reads of user data belong behind authenticated server paths, not here.
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

export function createBrowserClient(): SupabaseClient<Database> {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient<Database>(url, anonKey);
}
