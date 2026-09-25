/**
 * @winlerr/ai — provider-agnostic contract types.
 *
 * Canonical interfaces for chat, tools, usage, and providers.
 * Runtime validation lives in `./schemas.js`; transport lives in `./providers/`.
 */

export type ProviderName = "openrouter" | "openai" | "anthropic" | "ollama";

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool input. Kept structural — validate per tool. */
  parameters?: Record<string, unknown>;
}

export interface ChatParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  /** Optional caller-provided abort signal. Never serialized. */
  signal?: AbortSignal;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  text: string;
  model: string;
  provider: ProviderName;
  usage: Usage;
  /** Raw provider payload for debugging. Never log keys from it. */
  raw?: unknown;
}

export interface ProviderConfig {
  apiKey?: string;
  host?: string;
  model?: string;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

/** A bound provider: config is fixed at creation via `createProvider`. */
export interface Provider {
  readonly name: ProviderName;
  generate(params: ChatParams): Promise<ChatResult>;
  listModels(): Promise<ModelInfo[]>;
}
