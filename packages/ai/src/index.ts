/**
 * @winlerr/ai — LLM provider abstraction
 *
 * Keep all provider SDK calls behind this package.
 * Supports OpenAI, Anthropic, MCP, tool calling, and agent runtimes
 * with explicit schemas and bounded permissions.
 *
 * Prompts and model routing belong here or in @winlerr/config,
 * not inline in domain code.
 */

export type Provider = "openai" | "anthropic";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatOptions {
  provider?: Provider;
  model?: string;
  temperature?: number;
}

export async function chat(_messages: ChatMessage[], _options?: ChatOptions): Promise<string> {
  throw new Error("Not implemented — wire providers in @winlerr/ai");
}

export const placeholder = "ai" as const;
