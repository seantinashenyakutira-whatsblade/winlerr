/**
 * AI contract — Winlerr
 *
 * Provider-agnostic interface: Application → @winlerr/ai → Provider (OpenAI/Anthropic/other)
 * Supports model/provider selection, request/response, structured output, tool invocation,
 * token/usage metadata, and errors. No agent orchestration, memory, MCP, or RAG here.
 */

import type { z } from "zod";

export type Provider = "openai" | "anthropic" | (string & {});

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export interface AiRequest {
  provider?: Provider;
  model?: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  /** Structured output schema (Zod) — when provided, response should conform */
  responseSchema?: z.ZodTypeAny;
  /** Tenant scoping — every AI call is scoped to organization */
  organizationId?: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  provider: Provider;
  model: string;
  finishReason?: "stop" | "tool_calls" | "length" | "content_filter";
}

export type AiErrorCode =
  | "PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "MODEL_NOT_FOUND"
  | "CONTENT_FILTERED"
  | "TIMEOUT"
  | "UNKNOWN";

export interface AiError {
  code: AiErrorCode;
  message: string;
  provider?: Provider;
  retryable?: boolean;
  details?: unknown;
}
