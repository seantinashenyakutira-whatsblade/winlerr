/**
 * @winlerr/auth — Supabase Auth foundation for WinlaOS.
 *
 * Framework-free core (types, validation, redirects, errors, cookies,
 * session lifecycle) is importable anywhere. `./next` is the Next.js
 * App Router adapter — server-only, never import from client components.
 *
 * Explicit dependency (not faked): organization/role reads are unavailable
 * until the admin_profiles security migration lands — `getAdminProfile()`
 * throws until then (ADR 0002).
 */
export type {
  AuthErrorCode,
  AuthResult,
  AuthState,
  AuthUser,
} from "./types.js";
export { AUTH_ROUTES } from "./types.js";
export {
  callbackUrl,
  loginUrl,
  resolveAppUrl,
  safeNextPath,
  signupUrl,
} from "./redirects.js";
export {
  AUTH_ERROR_COPY,
  credentialsSchema,
  emailSchema,
  mapAuthError,
  passwordSchema,
  type Credentials,
} from "./errors.js";
export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE_SECONDS,
  cookieOptions,
  type CookieOptions,
  type CookieStore,
} from "./cookies.js";
export {
  exchangeCode,
  exchangeCode as exchangeCodeWithPorts,
  getSessionUser,
  getSessionUser as getSessionUserWithPorts,
  setSessionFromTokens,
  signIn,
  signIn as signInWithPorts,
  signOut,
  signOut as signOutWithPorts,
  signUp,
  signUp as signUpWithPorts,
  type AuthPorts,
  type SignUpInput,
  type SignUpOutcome,
  type SupabaseAuthPort,
} from "./session.js";
