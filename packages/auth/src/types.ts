/**
 * @winlerr/auth — shared auth types.
 *
 * Framework-free: safe to import from client components, server code, and
 * tests. Frontend consumes exactly these shapes (see
 * docs/development/auth-integration-contract.md).
 */

export interface AuthUser {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
}

/** Machine-readable auth failure reasons. Never surfaces raw provider text. */
export type AuthErrorCode =
  | "invalid-credentials"
  | "email-not-confirmed"
  | "email-exists"
  | "weak-password"
  | "invalid-email"
  | "session-expired"
  | "session-missing"
  | "env-missing"
  | "network"
  | "provider"
  | "unknown";

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthErrorCode };

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

/** Routes owned by the auth slice. Codex may skin the pages, not the paths. */
export const AUTH_ROUTES = {
  login: "/login",
  signup: "/signup",
  callback: "/auth/callback",
  dashboard: "/dashboard",
  getStarted: "/get-started",
} as const;
