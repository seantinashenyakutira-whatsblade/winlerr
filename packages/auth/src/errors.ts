/**
 * @winlerr/auth — provider error mapping + credential validation.
 *
 * Supabase error text is matched (never forwarded) to stable codes the UI
 * can render safely. Validation uses zod, mirroring packages/ai conventions.
 */
import { z } from "zod";
import type { AuthErrorCode } from "./types.js";

export const emailSchema = z.string().trim().min(1, "email-required").email("invalid-email").max(320);

export const passwordSchema = z
  .string()
  .min(8, "weak-password")
  .max(128, "weak-password");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type Credentials = z.infer<typeof credentialsSchema>;

/** Map a Supabase/provider error message to a stable UI code. */
export function mapAuthError(message: string | null | undefined): AuthErrorCode {
  const text = (message ?? "").toLowerCase();
  if (!text) return "unknown";
  if (text.includes("invalid login credentials") || text.includes("invalid email or password")) {
    return "invalid-credentials";
  }
  if (text.includes("email not confirmed") || text.includes("email confirmation")) {
    return "email-not-confirmed";
  }
  if (text.includes("already registered") || text.includes("already exists") || text.includes("user already")) {
    return "email-exists";
  }
  if (text.includes("password") && (text.includes("weak") || text.includes("short") || text.includes("length") || text.includes("at least") || text.includes("characters"))) {
    return "weak-password";
  }
  if (text.includes("invalid") && text.includes("email")) {
    return "invalid-email";
  }
  if (text.includes("expired") || text.includes("refresh token")) {
    return "session-expired";
  }
  if (text.includes("fetch") || text.includes("network") || text.includes("failed to fetch")) {
    return "network";
  }
  return "provider";
}

/** Human-facing copy per code. Single place Codex reads for UI strings. */
export const AUTH_ERROR_COPY: Record<AuthErrorCode, string> = {
  "invalid-credentials": "That email and password combination is incorrect.",
  "email-not-confirmed": "Please confirm your email first — check your inbox for the confirmation link.",
  "email-exists": "An account with this email already exists. Try signing in instead.",
  "weak-password": "Use at least 8 characters for your password.",
  "invalid-email": "Enter a valid email address.",
  "session-expired": "Your session expired. Please sign in again.",
  "session-missing": "You need to sign in to continue.",
  "env-missing": "Authentication is not configured. Please try again later.",
  "network": "Could not reach the authentication service. Check your connection and retry.",
  "provider": "Authentication failed. Please try again.",
  "unknown": "Something went wrong. Please try again.",
};
