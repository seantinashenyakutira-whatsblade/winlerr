/**
 * Database client contract — Winlerr
 *
 * Application code must depend on @winlerr/database rather than scattering
 * Supabase client creation throughout apps.
 *
 * Server/client separation:
 *  - createBrowserClient — browser, uses anon key, RLS enforced
 *  - createServerClient — server (Route Handler / Server Component), uses anon key + cookies
 *  - createAdminClient — server-only, uses service-role key, bypasses RLS (never on client)
 *
 * No real Supabase SDK is imported here at foundation stage — factories return
 * a typed interface that will be wired to @supabase/supabase-js when first
 * product needs DB. This keeps the boundary stable without requiring credentials.
 */

export interface DatabaseClientConfig {
  supabaseUrl: string;
  supabaseKey: string; // anon key for browser/server, service-role for admin
}

export interface QueryResult<T> {
  data: T[] | null;
  error: { code: string; message: string } | null;
}

export interface DatabaseClient {
  /**
   * Typed table access — placeholder. Replace with generated types when schema exists.
   * Example: client.from("organizations").select()
   */
  from<T = unknown>(table: string): {
    select: (columns?: string) => Promise<QueryResult<T>>;
    insert: (values: unknown) => Promise<QueryResult<T>>;
    update: (values: unknown) => Promise<QueryResult<T>>;
    delete: () => Promise<QueryResult<T>>;
  };
  /**
   * Whether this client bypasses RLS (admin only).
   */
  readonly bypassRls: boolean;
}

function createPlaceholderClient(bypassRls: boolean): DatabaseClient {
  const notImplemented = () => {
    throw new Error(
      "Database not wired — client is placeholder. Wire to @supabase/supabase-js when first migration ships."
    );
  };
  return {
    bypassRls,
    from: () => ({
      select: async () => {
        notImplemented();
        return { data: null, error: null };
      },
      insert: async () => {
        notImplemented();
        return { data: null, error: null };
      },
      update: async () => {
        notImplemented();
        return { data: null, error: null };
      },
      delete: async () => {
        notImplemented();
        return { data: null, error: null };
      },
    }),
  };
}

/**
 * Browser client — uses anon key, RLS enforced.
 * Must be called on client/brower context.
 */
export function createBrowserClient(config: DatabaseClientConfig): DatabaseClient {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("createBrowserClient: supabaseUrl and supabaseKey are required");
  }
  return createPlaceholderClient(false);
}

/**
 * Server client — for Route Handlers / Server Components.
 * Uses anon key + cookies (when Supabase Auth is wired).
 */
export function createServerClient(config: DatabaseClientConfig): DatabaseClient {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("createServerClient: supabaseUrl and supabaseKey are required");
  }
  if (typeof window !== "undefined") {
    throw new Error("createServerClient must not be called on client");
  }
  return createPlaceholderClient(false);
}

/**
 * Admin client — server-only, bypasses RLS.
 * Uses SUPABASE_SERVICE_ROLE_KEY — never expose to client.
 */
export function createAdminClient(config: DatabaseClientConfig): DatabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient must not be called on client — service-role would be exposed"
    );
  }
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("createAdminClient: supabaseUrl and service-role key are required");
  }
  return createPlaceholderClient(true);
}

/**
 * Documented access conventions:
 * - All product tables must include organization_id
 * - All queries must be scoped by organization_id
 * - RLS policies enforce tenant isolation; app scoping is defense-in-depth
 * - Migrations live in infrastructure/supabase/migrations/
 */
export const conventions = {
  tenantColumn: "organization_id" as const,
  migrationsPath: "infrastructure/supabase/migrations" as const,
} as const;
