# ADR 0004: Agentic Runtime Core

- Status: **Proposed**
- Date: 2026-11-05

## Context

Winlerr has a provider abstraction in `@winlerr/ai`, but automation and agent services were placeholders. A reusable execution layer needs bounded tool invocation, explicit scopes, human approval for sensitive effects, idempotency, execution state and audit records without coupling business logic to a model vendor or assuming unapproved database contracts.

## Options considered

1. Put tool execution and workflow state in each product app.
2. Build a full multi-agent orchestration framework and persistent workflow engine now.
3. Add a small provider-neutral execution kernel to `@winlerr/automation` and leave durable adapters and orchestration behind interfaces.

## Decision

Propose option 3. `@winlerr/automation` owns agent/tool contracts and one-tool deterministic execution. Tool inputs use strict Zod object schemas, tools declare scopes and effects, sensitive effects wait for an approval gateway, retries/timeouts are bounded, and state/audit/idempotency use adapter interfaces. `@winlerr/ai` remains responsible for provider routing and token/cost estimation. The agent service will later authenticate and assemble runtime requests; workers may later resume durable steps.

No Supabase schema, production action, customer integration or client-side credential access is introduced. Memory adapters are for local tests only.

## Consequences

- The execution kernel can be tested without model providers or customer systems.
- Persistent stores, approval UX, model tool-call parsing and workflow orchestration remain follow-up work subject to review.
- Tool code must cooperate with abort signals and downstream idempotency for side-effecting operations.
- Shared contracts are new and should be reviewed before services or apps depend on them.

## Alternatives rejected

- Per-app runtimes would duplicate permissions and audit behavior.
- Immediate multi-agent and durable orchestration work would add unproven complexity before the one-tool security boundary is exercised.
- A provider-specific tool-call contract would couple domain tools to model vendors.

## References

- [Agent Runtime architecture](../architecture/agent-runtime.md)
- [System Overview](../architecture/system-overview.md)
