# @winlerr/automation

Provider-neutral agent and workflow execution primitives. The first runtime
executes one explicitly selected tool call at a time; it does not run an LLM
loop or connect to customer systems.

## Runtime contracts

- Versioned agent definitions with explicit tool allowlists and scopes.
- Strict Zod tool input objects, optional output validation, effect categories,
  required scopes, bounded retries and timeouts.
- Sensitive effects pause through an approval gateway before the tool runs.
- Execution state, metadata-only audit events and idempotency are adapter
  interfaces. Memory adapters are intended for local tests only.
- Provider/model usage metadata can be attached to an execution via
  `AgentRuntime.recordUsage()`; provider access stays in `@winlerr/ai`.

See [`docs/architecture/agent-runtime.md`](../../docs/architecture/agent-runtime.md)
for the audit, lifecycle and service integration plan.
