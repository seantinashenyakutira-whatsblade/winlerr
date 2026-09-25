# @winlerr/ai

Provider-agnostic LLM abstraction. Route ALL provider calls through this package — application code must never import provider SDKs directly.

## Contract

- `src/types.ts` — `ProviderName`, `Message`, `ToolDefinition`, `ChatParams`, `ChatResult`, `Usage`, `ProviderConfig`, `Provider`.
- `src/schemas.ts` — Zod schemas + inferred `Validated*` types for untrusted inputs.
- `src/errors.ts` — `AiError` + typed subclasses (`MissingApiKeyError`, `ProviderRequestError`, `EmptyResponseError`) with secret redaction.
- `src/usage.ts` — token accumulation + static per-model cost table (`configurePricing()`, `AI_PRICING_JSON` override, `getUsage()`/`reset()`).
- `src/providers/` — `openrouter`, `openai`, `anthropic`, `ollama` behind `createProvider(name, config)`; `resolveDefaultResolution()` / `createDefaultProvider()` read `AI_DEFAULT_PROVIDER` / `AI_DEFAULT_MODEL` / `AI_FALLBACK_MODEL`.

## Providers

| Provider | Transport | Default model | Key env |
|---|---|---|---|
| `openrouter` | OpenAI-compatible chat (`/api/v1/chat/completions`) | `openai/gpt-4o-mini` | `OPENROUTER_API_KEY` |
| `openai` | Chat completions (`/v1/chat/completions`) | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `anthropic` | Messages API (`/v1/messages`, `anthropic-version: 2023-06-01`) | `claude-3-5-haiku-20241022` | `ANTHROPIC_API_KEY` |
| `ollama` | Local HTTP (`/api/generate`, no key) | none (required) | `OLLAMA_HOST` (default `http://localhost:11434`) |

All adapters are fetch-based with bounded retries (max 2 attempts, linear backoff) on 5xx/empty payloads. No provider SDK dependencies.

## Attribution

Transport retry semantics and text-extraction shapes ported from **wanie** (MIT License, Copyright (c) 2026 asepindrak, https://github.com/asepindrak/wanie — `server/ai/llm-adapters/`), rewritten in strict TypeScript. Two deliberate modernizations: Anthropic moved from wanie's retired legacy `/v1/complete` API to the current Messages API, and default models updated from retired identifiers (`gpt-3.5-turbo`, `claude-2`) to current ones. Transcription and legacy-completions paths were intentionally omitted (chat-only contract).

## Env vars

`OPENROUTER_API_KEY`, `AI_DEFAULT_PROVIDER`, `AI_DEFAULT_MODEL`, `AI_FALLBACK_MODEL` (see `.env.example`). Provider-specific keys/hosts (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_HOST`, …) are honored per-provider when set. Keys are server-only — never import this package's providers in client bundles with keys present.
