/**
 * @winlerr/config — platform configuration & result contracts
 *
 * Runtime configuration validation (Zod), public/server distinction,
 * typed access, and shared Result/Error convention.
 *
 * Server-only secrets are never exposed to client bundles — loadServerConfig
 * throws on client. Use redactConfig for safe logging.
 */

export * from "./env.js";
export * from "./result.js";
