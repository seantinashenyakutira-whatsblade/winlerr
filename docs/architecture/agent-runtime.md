# Winlerr Agent Runtime

Status: **Minimum execution foundation implemented; service and persistence integration pending.**

## Current architecture audit

| Area                  | Existing implementation                                                                                                          | Runtime implication                                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider abstraction  | `@winlerr/ai` defines provider-neutral chat contracts and fetch-based OpenRouter, OpenAI, Anthropic and Ollama adapters.         | Keep model calls behind this package. The execution kernel accepts explicit tool calls and is independent of provider response formats.                                                                        |
| Model routing         | `createDefaultProvider()` resolves provider/model from `AI_DEFAULT_PROVIDER`, `AI_DEFAULT_MODEL` and `AI_FALLBACK_MODEL`.        | Agents store a logical `modelRoute`; the host resolves it with `@winlerr/ai`. Fallback policy and multi-step model orchestration remain host concerns.                                                         |
| Tool definitions      | `@winlerr/ai` has a structural `ToolDefinition` and provider schemas, but no invocation or authorization runtime.                | `@winlerr/automation` now owns executable tool definitions with Zod input/output validation, effects, scopes and bounded timeout/retry settings.                                                               |
| Prompt/configuration  | No shared prompt registry or version resolver was found. The AI package has provider config and environment-based routing.       | Agent definitions refer to a versioned `instructionsRef`; the caller resolves prompt text/config outside tool business logic.                                                                                  |
| Automation            | `@winlerr/automation` was a placeholder.                                                                                         | It now provides a deterministic one-tool execution kernel, interfaces and memory adapters. This is not yet a workflow scheduler or durable queue.                                                              |
| Agent/worker services | `services/agents` and `services/workers` were placeholders.                                                                      | They remain integration boundaries. They should authenticate requests, resolve approved agent versions, supply caller grants and persistent adapters, and call the shared runtime.                             |
| Webhooks              | `services/webhooks` was a placeholder.                                                                                           | No webhook execution path is introduced. Future enqueueing must validate signatures, deduplicate event IDs and avoid executing untrusted instructions directly.                                                |
| Notifications         | `@winlerr/notifications` was a placeholder.                                                                                      | The runtime does not send messages. Customer communications are classified as sensitive and require a human approval gateway decision.                                                                         |
| Audit and usage       | `@winlerr/ai` has token aggregation and static/overridable per-model cost estimation. No shared execution audit store was found. | Runtime events carry IDs, state transitions, error codes and optional usage metadata; they intentionally omit prompts, inputs, outputs and credentials. A host can bridge provider usage into `recordUsage()`. |

## Minimum contracts

- **Agent definition:** immutable `id` and `version`, display name, versioned prompt reference, optional logical model route, explicit tool ID allowlist and declared scopes.
- **Tool registration:** unique ID, description, Zod object input schema (root object made strict at registration; nested objects should also be strict), optional output schema, required scopes, side-effect classification, bounded timeout and bounded retry policy.
- **Execution context:** run, organization, actor, agent and tool-call IDs; the tool receives only the intersection of its required scopes, the agent's declared scopes and the caller's server-derived grants. Every side-effecting tool must declare at least one scope. No credentials are present in the context.
- **Approval checkpoint:** sensitive tools provide a bounded human-review summary. Sensitive effects request approval from `ApprovalGateway` before invocation. `pending` yields `waiting_for_approval`; `denied` yields `rejected`; only `approved` reaches the tool. The summary is delivered to the approval adapter and omitted from audit events. The gateway is a contract only; UI and approval persistence are not included.
- **Workflow/execution state:** `running`, `waiting_for_approval`, `succeeded`, `failed`, `rejected` and `cancelled`, keyed by run and tool-call IDs. The current kernel executes one tool call per invocation; orchestration over multiple steps is external.
- **Idempotency:** adapters key calls by organization, agent, tool and caller-provided idempotency key. The memory adapter deduplicates concurrent/completed calls and releases failed/cancelled outcomes for a later retry. Durable adapters must preserve this behavior across processes and restarts.
- **Retry and timeout:** retry count is capped at five; only `ToolExecutionError` explicitly marked retryable is retried. Timeout is capped at 30 seconds. Cancellation propagates an `AbortSignal`. A side-effecting tool must honor the signal or provide its own idempotency because a timed-out external operation may already have completed.
- **Audit and cost:** append-only adapter interface receives lifecycle events and safe error codes, never tool payloads. Optional provider/model token and cost metadata can be attached through `recordUsage()`; `@winlerr/ai` remains the source of model usage/cost estimation.
- **Failures:** schema/scope/registry violations throw typed `RuntimeError`s before tool execution. Tool failures become typed terminal results and state. Only explicitly classified transient tool errors are retried.

## Execution sequence

1. Host authenticates actor and organization, loads an immutable agent version, and supplies server-derived grants.
2. Runtime checks tool allowlist, scope intersection and strict input schema.
3. Runtime stores `running` state and an `execution.started` event.
4. Sensitive side effects request approval. Pending/denied decisions persist their checkpoint state and return without invoking the tool.
5. Runtime deduplicates by idempotency key, invokes the tool with a scoped context and abort signal, applies bounded retries and validates output if configured.
6. Runtime persists the terminal state and appends a metadata-only audit event.

## Service integration path

`services/agents` should be the authenticated adapter: resolve agent config and tool registry, enforce tenant-level permissions, call `AgentRuntime`, and map outcomes to an API contract. `services/workers` can later resume durable workflow steps using the same run and tool-call IDs. Production implementations should provide persistent execution, audit, idempotency and approval adapters behind the interfaces, then reconcile storage contracts with HQ before any schema proposal. No Supabase schema changes are part of this foundation.

Before connecting customer systems, add per-tenant integration credentials through a server-only secret boundary, tool-level action limits, rate limits, approval expiry/revocation and an operator-visible review surface. Financial or destructive tools should also use downstream provider idempotency keys where supported.

## Explicit limits

This foundation does not run an LLM loop, plan workflows, persist to Supabase, resolve prompts, send notifications, connect external systems, implement approval UI, or define a speculative multi-agent protocol. It proves deterministic scoped execution and defines the contracts required to add those pieces after review.
