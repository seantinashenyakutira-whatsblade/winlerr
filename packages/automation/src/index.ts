/**
 * @winlerr/automation — workflow & automation primitives
 *
 * Status: Deferred (Proposal)
 *
 * n8n remains the R&D/automation platform for experiments (e.g., Lead Response Agent).
 * No reusable platform abstraction is validated yet beyond n8n.
 *
 * When a contract is justified, it will define:
 *   Workflow, Trigger, Action, ExecutionContext, ExecutionResult
 * Keep provider-neutral and do not duplicate n8n internally.
 *
 * Applications should not depend on this package until the contract is Established.
 */

export const placeholder = "automation" as const;
