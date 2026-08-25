/**
 * Database client contract — Winlerr
 *
 * Application code must depend on @winlerr/database rather than scattering
 * Supabase client creation throughout apps.
 *
 * Server/client separation:
 *  - createBrowserClient — browser, anon key, RLS enforced
 *  - createServerClient — server (Route Handler / Server Component), anon key + cookies
 *  - createAdminClient — server-only, service-role key, bypasses RLS (never on client)
 *
 * Domain persistence: organizations, memberships, audit_log are the only tables
 * in the initial migration. All organization-scoped queries must include organization_id.
 * RLS is primary tenant isolation; app scoping is defense-in-depth.
 */

export interface DatabaseClientConfig {
  supabaseUrl: string;
  supabaseKey: string; // anon for browser/server, service-role for admin
}

export interface QueryResult<T> {
  data: T[] | null;
  error: { code: string; message: string } | null;
}

export interface DatabaseClient {
  from<T = unknown>(table: string): {
    select: (columns?: string) => Promise<QueryResult<T>>;
    insert: (values: unknown) => Promise<QueryResult<T>>;
    update: (values: unknown) => Promise<QueryResult<T>>;
    delete: () => Promise<QueryResult<T>>;
  };
  readonly bypassRls: boolean;
}

function createPlaceholderClient(bypassRls: boolean): DatabaseClient {
  const notImplemented = () => {
    throw new Error(
      "Database not wired — client is placeholder. Wire to @supabase/supabase-js when Supabase is configured. See packages/database/src/client.ts"
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

export function createBrowserClient(config: DatabaseClientConfig): DatabaseClient {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("createBrowserClient: supabaseUrl and supabaseKey are required");
  }
  return createPlaceholderClient(false);
}

export function createServerClient(config: DatabaseClientConfig): DatabaseClient {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("createServerClient: supabaseUrl and supabaseKey are required");
  }
  if (typeof window !== "undefined") {
    throw new Error("createServerClient must not be called on client");
  }
  return createPlaceholderClient(false);
}

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
 * Domain helpers — to be used when Supabase is wired.
 * These are conventions, not yet wired to real queries.
 */
export const domainTables = {
  organizations: "organizations" as const,
  memberships: "memberships" as const,
  auditLog: "audit_log" as const,
} as const;

export const conventions = {
  tenantColumn: "organization_id" as const,
  migrationsPath: "infrastructure/supabase/migrations" as const,
  rlsEnabledTables: ["organizations", "memberships", "audit_log"] as const,
} as const;

/**
 * Audit log helper type — ensures audit entries are organization-scoped and
 * never log secrets. Use this shape when inserting into audit_log.
 */
export type AuditLogInsert = {
  organization_id: string;
  actor_user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  metadata?: Record<string, unknown> | null;
};
