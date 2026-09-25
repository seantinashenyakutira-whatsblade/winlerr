/**
 * @winlerr/ai — Zod schemas for the provider contract.
 *
 * Validates untrusted inputs (API bodies, webhook payloads, test fixtures)
 * before they reach providers. Inferred types are exported alongside the
 * canonical interfaces in `./types.js`.
 */
import { z } from "zod";

export const RoleSchema = z.enum(["system", "user", "assistant", "tool"]);

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
  name: z.string().optional(),
});

export const ToolDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const ChatParamsSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  tools: z.array(ToolDefinitionSchema).optional(),
});

export const UsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

export const ChatResultSchema = z.object({
  text: z.string(),
  model: z.string(),
  provider: z.enum(["openrouter", "openai", "anthropic", "ollama"]),
  usage: UsageSchema,
  raw: z.unknown().optional(),
});

export type ValidatedRole = z.infer<typeof RoleSchema>;
export type ValidatedMessage = z.infer<typeof MessageSchema>;
export type ValidatedToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ValidatedChatParams = z.infer<typeof ChatParamsSchema>;
export type ValidatedUsage = z.infer<typeof UsageSchema>;
export type ValidatedChatResult = z.infer<typeof ChatResultSchema>;
