/**
 * @winlerr/ai — provider-agnostic AI boundary
 *
 * Application → @winlerr/ai → Provider (OpenAI/Anthropic/other)
 * All provider SDK calls go through this package.
 * No agent orchestration, memory, or MCP here.
 */

export * from "./types.js";
export * from "./client.js";
