/**
 * @winlerr/ai — typed errors.
 *
 * Every error carries a stable `code` for programmatic handling.
 * Messages are sanitized: API keys, tokens, and Authorization headers
 * are redacted before they can reach logs or clients.
 */

export type AiErrorCode =
  | "AI_MISSING_API_KEY"
  | "AI_REQUEST_FAILED"
  | "AI_EMPTY_RESPONSE"
  | "AI_INVALID_PARAMS"
  | "AI_ABORTED";

export class AiError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}

export class MissingApiKeyError extends AiError {
  constructor(provider: string) {
    super(
      "AI_MISSING_API_KEY",
      `${provider}: API key missing. Provide config.apiKey or set the provider key env var (see README).`,
    );
    this.name = "MissingApiKeyError";
  }
}

export class ProviderRequestError extends AiError {
  readonly status?: number;

  constructor(provider: string, status: number | undefined, detail: string) {
    super(
      "AI_REQUEST_FAILED",
      `${provider} request failed${status !== undefined ? `: ${status}` : ""}${detail ? ` ${redactSecrets(detail)}` : ""}`,
    );
    this.name = "ProviderRequestError";
    this.status = status;
  }
}

export class EmptyResponseError extends AiError {
  constructor(provider: string) {
    super("AI_EMPTY_RESPONSE", `${provider} response contained no usable text.`);
    this.name = "EmptyResponseError";
  }
}

/**
 * Redact anything that looks like a credential before logging or
 * embedding in an error message. Values are never preserved.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(/sk-[A-Za-z0-9-_]{8,}/g, "[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/=]{8,}/g, "Bearer [REDACTED]")
    .replace(/("?(?:api[_-]?key|apiKey|token|secret)"?\s*[:=]\s*"?)[^",}\s]{4,}/gi, "$1[REDACTED]");
}
