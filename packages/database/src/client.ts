import {
  createBrowserClient as createSupabaseBrowserClient,
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.generated.js";

/**
 * Database client boundary — Winlerr.
 *
 * Application code must depend on @winlerr/database rather than scattering
 * Supabase client creation throughout apps. All clients are typed against the
 * generated staging schema, and RLS remains the default enforcement layer.
 *
 * Server/client separation:
 *  - createBrowserClient — browser, anon key, RLS enforced
 *  - createServerClient — server request, anon key, optional cookies/token
 *  - createAdminClient — server-only, service-role key, bypasses RLS
 */

export interface CookieOptions {
  domain?: string;
  encode?: (value: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
}

/** Minimal adapter for framework request/response cookie stores. */
export interface ServerCookie {
  name: string;
  value: string;
}

export interface ServerCookieStore {
  get(name: string): string | undefined;
  getAll?(): ServerCookie[];
  set?(name: string, value: string, options?: CookieOptions): void;
  setAll?(cookies: Array<ServerCookie & { options: CookieOptions }>): void;
  remove?(name: string, options?: CookieOptions): void;
}

export interface DatabaseClientConfig {
  supabaseUrl: string;
  /** Anon/publishable key for browser/server clients; service-role for admin. */
  supabaseKey: string;
  /** Optional access token for a server request without a cookie store. */
  accessToken?: string;
  /** Optional request/response cookie bridge for server-side sessions. */
  cookies?: ServerCookieStore;
}

export type DatabaseClient = SupabaseClient<Database> & {
  /** True only for the deliberately server-only service-role client. */
  readonly bypassRls: boolean;
};

function assertConfig(config: DatabaseClientConfig, factoryName: string): void {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error(`${factoryName}: supabaseUrl and supabaseKey are required`);
  }
  try {
    new URL(config.supabaseUrl);
  } catch {
    throw new Error(`${factoryName}: supabaseUrl must be a valid URL`);
  }
}

function withRlsMarker(client: SupabaseClient<Database>, bypassRls: boolean): DatabaseClient {
  Object.defineProperty(client, "bypassRls", {
    configurable: false,
    enumerable: true,
    value: bypassRls,
    writable: false,
  });
  return client as DatabaseClient;
}

function authOptions(config: DatabaseClientConfig) {
  return {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    ...(config.accessToken
      ? { global: { headers: { Authorization: `Bearer ${config.accessToken}` } } }
      : {}),
  } as const;
}

export function createBrowserClient(config: DatabaseClientConfig): DatabaseClient {
  assertConfig(config, "createBrowserClient");
  return withRlsMarker(
    createSupabaseBrowserClient<Database>(config.supabaseUrl, config.supabaseKey),
    false
  );
}

export function createServerClient(config: DatabaseClientConfig): DatabaseClient {
  assertConfig(config, "createServerClient");
  if (typeof window !== "undefined") {
    throw new Error("createServerClient must not be called on client");
  }

  const client = config.cookies
    ? createSupabaseServerClient<Database>(config.supabaseUrl, config.supabaseKey, {
        cookies: {
          getAll: () => {
            const cookies = config.cookies?.getAll?.();
            if (cookies) return cookies;
            const raw = config.cookies?.get("supabase-auth-token");
            return raw ? [{ name: "supabase-auth-token", value: raw }] : [];
          },
          setAll: cookies => {
            if (config.cookies?.setAll) {
              config.cookies.setAll(cookies);
              return;
            }
            for (const cookie of cookies) {
              config.cookies?.set?.(cookie.name, cookie.value, cookie.options);
            }
          },
        },
      })
    : createSupabaseClient<Database>(config.supabaseUrl, config.supabaseKey, authOptions(config));

  return withRlsMarker(client, false);
}

export function createAdminClient(config: DatabaseClientConfig): DatabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient must not be called on client — service-role would be exposed"
    );
  }
  assertConfig(config, "createAdminClient");
  return withRlsMarker(
    createSupabaseClient<Database>(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }),
    true
  );
}

/**
 * Domain helpers — intentionally limited to the foundation schema during
 * Phase 6. Product tables and behavior are out of scope.
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

export type AuditLogInsert = {
  organization_id: string;
  actor_user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  metadata?: Record<string, unknown> | null;
};
