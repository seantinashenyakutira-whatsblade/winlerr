/**
 * Integration adapter factory — placeholder
 *
 * Demonstrates adapter pattern without real provider logic.
 */

import type {
  IntegrationProvider,
  IntegrationAdapter,
  IntegrationResult,
} from "./types.js";

export interface ExampleConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ExampleRequest {
  to: string;
  message: string;
  organizationId: string;
}

export interface ExampleResponse {
  externalId: string;
  status: string;
}

export function createExampleAdapter(
  provider: IntegrationProvider
): IntegrationAdapter<ExampleConfig, ExampleRequest, ExampleResponse> {
  return {
    provider,
    validateConfig(config: ExampleConfig) {
      if (!config.apiKey) {
        return { valid: false, error: "apiKey is required" };
      }
      return { valid: true };
    },
    async execute(
      config: ExampleConfig,
      request: ExampleRequest
    ): Promise<IntegrationResult<ExampleResponse>> {
      const configCheck = this.validateConfig(config);
      if (!configCheck.valid) {
        return {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: configCheck.error ?? "invalid config",
            provider,
            retryable: false,
          },
        };
      }
      if (!request.organizationId) {
        return {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "organizationId is required",
            provider,
            retryable: false,
          },
        };
      }
      // No real external call — return placeholder success
      // Real adapter would: attach auth, handle retries, never leak secrets
      return {
        ok: true,
        data: {
          externalId: `mock-${Date.now()}`,
          status: "queued",
        },
      };
    },
  };
}
