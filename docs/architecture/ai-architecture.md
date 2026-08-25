# AI Architecture — Winlerr

- **Status:** Current Plan (foundation) → future scales as Proposal/Experiment
- **Package:** `@winlerr/ai` (sole AI surface)
- **Related:** ADR 0002, `docs/architecture/integrations.md`, `docs/architecture/security.md`

## 1. Principle

> Application layer must not be tightly coupled to one LLM provider.

All provider SDK calls go through `@winlerr/ai`. Business code calls `chat()`, not `openai.chat.completions.create()`.

## 2. Conceptual Map

```
Winlerr AI (@winlerr/ai)
  ├─ Model Providers
  │    ├─ OpenAI (gpt-*, o-series)
  │    ├─ Anthropic (claude-*)
  │    └─ Other (future, via registry)
  ├─ Agents (bounded, audited, permission-scoped)
  ├─ Tools (Zod schemas, explicit side effects)
  ├─ MCP (Model Context Protocol — compatibility layer)
  ├─ Memory (conversation + entity store — Proposal)
  └─ Evaluations (prompt/model regression — Proposal)
```

## 3. Current Implementation (Foundation)

`packages/ai/src/index.ts` today:

```ts
export type Provider = "openai" | "anthropic";
export interface ChatMessage { role: "system"|"user"|"assistant"|"tool"; content: string; }
export interface ChatOptions { provider?: Provider; model?: string; temperature?: number; }
export async function chat(messages, options): Promise<string> { throw new Error("Not implemented"); }
```

This is a **placeholder** — correct for foundation stage. It locks the import path and interface without hard-wiring a vendor.

### Current Plan surface (to be implemented when first AI feature ships)

```ts
// @winlerr/ai — Current Plan interface (not yet implemented)
export interface Tool { name: string; description: string; schema: ZodType; execute: (input) => Promise<unknown>; }
export interface Agent { id: string; tools: Tool[]; permissions: string[]; run(input: string): Promise<string>; }
export function registerProvider(name: Provider, client: ProviderClient): void;
export async function chat(messages: ChatMessage[], opts?: ChatOptions & { tools?: Tool[] }): Promise<ChatResult>;
```

- **Provider registry**: map `"openai" → openai client`, `"anthropic" → anthropic client`, configurable per env (OPENAI_API_KEY/ANTHROPIC_API_KEY server-only).
- **Tools**: every tool has explicit Zod input schema, description, bounded side effects, and audit log entry (who called what with which input, in which org).
- **Prompt/config separation**: prompts and model routing live in `packages/ai` or `packages/config`, not inline in domain code.

## 4. Agents & Permissions — Proposal (not Established)

- Agents have **bounded permissions** (declare which tools they may call, which orgs, which side effects).
- AI-initiated writes (DB, external APIs, customer comms) require **explicit human approval or tightly-scoped policy** unless operator has opted in (per AGENTS.md §5).
- All tool calls are logged: `{ org_id, agent_id, tool, input, output, user_id, timestamp }` → `audit_log` or dedicated AI audit table.

## 5. MCP & Memory — Proposal

- **MCP**: compatibility layer in `@winlerr/ai` for exposing tools to MCP-capable clients; not wired until first MCP use case.
- **Memory**: conversation history and entity memory (e.g., lead context) stored in Postgres (scoped by organization_id) — Proposal, not Established.

## 6. What is NOT built now

- No agent runtime in `services/agents` yet — directory exists as logical placeholder; early agents run as library calls from Route Handlers.
- No vector DB — defer until RAG use case validated; when needed, evaluate pgvector (Supabase) first.
- No eval harness — defer until prompt regression matters.

## 7. Current vs Future

| Capability | Now | Future (Proposal/Experiment) |
|------------|-----|------------------------------|
| chat() | placeholder throw | provider registry, fallback, retry |
| Tools | type only | Zod schemas, execute, audit, permission gates |
| Agents | type | orchestration, tool calling loop, human-in-the-loop |
| MCP | — | adapter |
| Memory | — | Postgres + pgvector |
| Evals | — | prompt/versioned eval set |

## 8. Next Step

When first product needs LLM (e.g., whatsapp-agent), implement `chat()` with OpenAI/Anthropic routing, one Tool example, and audit logging — keep PR small.
