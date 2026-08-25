/**
 * Integration contract — Winlerr
 *
 * Provider-independent boundaries: Application → Integration interface → Provider adapter → External API
 * No real integrations, no credentials, no external calls.
 */

export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

export type IntegrationProvider =
  | "whatsapp"
  | "email"
  | "calendar"
  | "crm"
  | "payments"
  | "social"
  | (string & {});

export type IntegrationErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "TIMEOUT"
  | "NOT_FOUND"
  | "UNKNOWN";

export interface IntegrationError {
  code: IntegrationErrorCode;
  message: string;
  provider: IntegrationProvider;
  retryable?: boolean;
  details?: unknown;
}

export type IntegrationResult<T> = Result<T, IntegrationError>;

/**
 * Adapter interface — every external system implements this shape.
 * Example: WhatsApp adapter, Email adapter, etc.
 */
export interface IntegrationAdapter<Config, Request, Response> {
  provider: IntegrationProvider;
  /**
   * Validate config without making external call.
   */
  validateConfig(config: Config): { valid: boolean; error?: string };
  /**
   * Execute request — placeholder, no real API call.
   */
  execute(config: Config, request: Request): Promise<IntegrationResult<Response>>;
}

/**
 * Webhook concepts — inbound webhooks from providers.
 */
export interface WebhookEvent<T = unknown> {
  provider: IntegrationProvider;
  eventId: string;
  eventType: string;
  payload: T;
  timestamp: string;
  signature?: string;
}

export interface WebhookVerification {
  /**
   * Verify HMAC signature (timing-safe). No logging of raw signature.
   */
  verify(signature: string, rawBody: string, secret: string): boolean;
  /**
   * Idempotency check — dedup by provider event id.
   */
  isDuplicate(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

/**
 * Conventional request/response wrappers for integrations.
 */
export interface IntegrationRequest {
  organizationId: string;
  payload: unknown;
}

export interface IntegrationResponse {
  provider: IntegrationProvider;
  externalId?: string;
  data?: unknown;
}
