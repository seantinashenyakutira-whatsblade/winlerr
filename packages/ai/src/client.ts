/**
 * AI client contract — placeholder implementation
 *
 * At foundation stage, no provider SDK is wired. This defines the interface
 * that future providers will implement. Applications call chat() via @winlerr/ai,
 * never directly via openai/anthropic SDKs.
 */

import type { AiRequest, AiResponse, AiError } from "./types.js";

export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

export interface AiClient {
  chat(request: AiRequest): Promise<Result<AiResponse, AiError>>;
  /**
   * Validate that request has required fields without making external call.
   */
  validate(request: AiRequest): { valid: boolean; error?: string };
}

function notImplemented(): never {
  throw new Error(
    "AI provider not wired — implement provider adapter in @winlerr/ai when first AI product ships. See docs/architecture/platform-contracts.md"
  );
}

export function createAiClient(): AiClient {
  return {
    // TODO: wire provider registry (openai/anthropic) when needed
    async chat(_request: AiRequest) {
      notImplemented();
      // placeholder: unreachable, but type-correct
      return { ok: false, error: { code: "UNKNOWN", message: "not implemented" } } as never;
    },
    validate(request: AiRequest) {
      if (!request.messages || request.messages.length === 0) {
        return { valid: false, error: "messages is required" };
      }
      for (const m of request.messages) {
        if (!m.role || !m.content) {
          return { valid: false, error: "each message requires role and content" };
        }
      }
      if (request.tools) {
        for (const t of request.tools) {
          if (!t.name || !t.description || !t.schema) {
            return { valid: false, error: `tool ${t.name} missing required fields` };
          }
        }
      }
      return { valid: true };
    },
  };
}

// Singleton placeholder — ensures import path is stable
export const ai = createAiClient();
