/**
 * @winlerr/auth — session cookie contract.
 *
 * Tokens live in httpOnly cookies (never localStorage) so XSS cannot steal
 * them and the server can validate every request. Names are Winlerr-scoped
 * to avoid colliding with other Supabase projects on shared domains.
 */

export const ACCESS_COOKIE = "winlerr-sb-access";
export const REFRESH_COOKIE = "winlerr-sb-refresh";

/** 7 days — matches the refresh-token reuse window for weekly-active users. */
export const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function cookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  };
}

/** Minimal cookie-store port — implemented by the Next adapter (next.ts). */
export interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  delete(name: string): void;
}
