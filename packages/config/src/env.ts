import { z } from "zod";

/**
 * Configuration contract — Winlerr
 *
 * Validates environment variables, distinguishes server-only from public,
 * fails clearly when required config is missing, and never exposes secrets
 * to client bundles.
 *
 * Server-only variables must never be read on client (window !== undefined).
 */

// Public variables — safe to expose to client (NEXT_PUBLIC_*)
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

// Server-only variables — must never be bundled to client
const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ZONE_ID: z.string().min(1).optional(),
});

export type PublicConfig = z.infer<typeof publicEnvSchema>;
export type ServerConfig = z.infer<typeof serverEnvSchema>;

export type EnvSchema = typeof serverEnvSchema;

/**
 * Parse public env — does not require server secrets.
 * Throws ZodError with clear message if validation fails.
 */
export function parsePublicEnv(
  env: Record<string, string | undefined>
): PublicConfig {
  return publicEnvSchema.parse(env);
}

/**
 * Parse server env — includes server-only secrets.
 * Throws if required server vars are invalid.
 * All server vars are optional at foundation stage to allow placeholder dev.
 */
export function parseServerEnv(
  env: Record<string, string | undefined>
): ServerConfig {
  return serverEnvSchema.parse(env);
}

/**
 * Load public config from process.env.
 * Safe to call on client.
 */
export function loadPublicConfig(): PublicConfig {
  if (typeof process === "undefined" || !process.env) {
    throw new Error("process.env is not available");
  }
  return parsePublicEnv(process.env as Record<string, string | undefined>);
}

/**
 * Load server config from process.env.
 * Must NOT be called on client — throws if window is defined.
 * Fails clearly with Zod error if env is invalid.
 */
export function loadServerConfig(): ServerConfig {
  if (typeof window !== "undefined") {
    throw new Error(
      "loadServerConfig must not be called on client — server-only secrets would be exposed"
    );
  }
  if (typeof process === "undefined" || !process.env) {
    throw new Error("process.env is not available");
  }
  return parseServerEnv(process.env as Record<string, string | undefined>);
}

/**
 * Redact secrets for logging — never log raw values.
 * Any key containing KEY, SECRET, TOKEN, PASSWORD is redacted.
 */
export function redactConfig(
  config: Record<string, unknown>
): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    const isSecret =
      /KEY|SECRET|TOKEN|PASSWORD/i.test(key) ||
      key === "DATABASE_URL";
    if (isSecret) {
      redacted[key] = value ? "[REDACTED]" : "[EMPTY]";
    } else {
      redacted[key] = String(value ?? "");
    }
  }
  return redacted;
}

/**
 * Check if we are running on server.
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}
