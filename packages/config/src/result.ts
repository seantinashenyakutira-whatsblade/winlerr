/**
 * Result / Error contract — Winlerr
 *
 * Small shared convention for application/service results.
 * Provides consistent success/failure shapes across future products.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  /**
   * HTTP status that this error maps to.
   * If not provided, use toHttpStatus(code).
   */
  status?: number;
}

export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Create a success result.
 */
export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

/**
 * Create a failure result.
 */
export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard for success.
 */
export function isOk<T, E>(
  result: Result<T, E>
): result is { ok: true; data: T } {
  return result.ok;
}

/**
 * Type guard for failure.
 */
export function isErr<T, E>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Map error code to HTTP status.
 */
export function toHttpStatus(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "AUTHENTICATION_ERROR":
      return 401;
    case "AUTHORIZATION_ERROR":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "RATE_LIMITED":
      return 429;
    case "EXTERNAL_SERVICE_ERROR":
      return 502;
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 500;
  }
}

/**
 * Create an AppError with correct status.
 */
export function createError(
  code: ErrorCode,
  message: string,
  details?: unknown
): AppError {
  return {
    code,
    message,
    details,
    status: toHttpStatus(code),
  };
}

/**
 * Helper to convert unknown thrown value to AppError.
 */
export function toAppError(
  error: unknown,
  fallbackCode: ErrorCode = "INTERNAL_ERROR"
): AppError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  ) {
    const e = error as AppError;
    if (typeof e.code === "string" && typeof e.message === "string") {
      return {
        code: e.code as ErrorCode,
        message: e.message,
        details: (e as { details?: unknown }).details,
        status: (e as { status?: number }).status ?? toHttpStatus(e.code as ErrorCode),
      };
    }
  }
  if (error instanceof Error) {
    return createError(fallbackCode, error.message);
  }
  return createError(fallbackCode, String(error));
}
