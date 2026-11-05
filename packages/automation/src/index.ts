/**
 * Minimal, provider-neutral execution contracts for Winlerr agents.
 *
 * The runtime executes one explicitly selected tool at a time. Model calls,
 * workflow planning, persistence and service authentication stay behind their
 * own package/service boundaries.
 */
import { z, type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";

export const AgentDefinitionSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    name: z.string().min(1),
    /** Versioned prompt/config reference; prompt text is resolved by the host. */
    instructionsRef: z.string().min(1),
    /** Optional logical route resolved through @winlerr/ai by the host. */
    modelRoute: z.string().min(1).optional(),
    toolIds: z.array(z.string().min(1)).max(100),
    scopes: z.array(z.string().min(1)).max(100),
  })
  .strict();

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

export function defineAgent(definition: AgentDefinition): AgentDefinition {
  return AgentDefinitionSchema.parse(definition);
}

export const ToolEffectSchema = z.enum([
  "read",
  "write",
  "customer_communication",
  "financial",
  "external_write",
  "destructive",
]);
export type ToolEffect = z.infer<typeof ToolEffectSchema>;

export interface ToolExecutionContext {
  runId: string;
  organizationId: string;
  actorId: string;
  agentId: string;
  /** Intersection of the agent's declared scopes and the caller's grants. */
  grantedScopes: readonly string[];
  signal: AbortSignal;
}

export interface RetryPolicy {
  /** Total attempts including the first. Always bounded to 1..5. */
  maxAttempts: number;
  backoffMs: number;
}

export interface AgentTool<I = unknown, O = unknown> {
  id: string;
  description: string;
  inputSchema: ZodObject<ZodRawShape>;
  outputSchema?: ZodTypeAny;
  requiredScopes: readonly string[];
  effect: ToolEffect;
  /** Human-review text for sensitive actions; never copied into audit events. */
  approvalSummary?: (input: I) => string;
  timeoutMs: number;
  retry: RetryPolicy;
  execute(input: I, context: ToolExecutionContext): Promise<O> | O;
}

/** Type-erased registry entry; execution still validates input before calling it. */
type RegisteredTool = AgentTool<never, unknown>;

type ToolDefinitionInput<S extends ZodObject<ZodRawShape>, O> = Omit<
  AgentTool<z.infer<S>, O>,
  "inputSchema"
> & {
  inputSchema: S;
};

/**
 * Register a tool with a strict root input object and bounded execution
 * settings. Nested Zod objects should also be declared with `.strict()`.
 */
export function defineTool<S extends ZodObject<ZodRawShape>, O>(
  tool: ToolDefinitionInput<S, O>
): AgentTool<z.infer<S>, O> {
  const timeoutMs = z.number().int().min(1).max(30_000).parse(tool.timeoutMs);
  const retry = z
    .object({
      maxAttempts: z.number().int().min(1).max(5),
      backoffMs: z.number().int().min(0).max(5_000),
    })
    .strict()
    .parse(tool.retry);
  if (tool.effect !== "read" && tool.requiredScopes.length === 0) {
    throw new RuntimeError(
      "TOOL_SCOPE_REQUIRED",
      "Side-effecting tools must declare at least one scope"
    );
  }
  if (APPROVAL_REQUIRED.has(tool.effect) && !tool.approvalSummary) {
    throw new RuntimeError(
      "APPROVAL_SUMMARY_REQUIRED",
      "Sensitive tools must provide a human-review summary"
    );
  }
  return {
    ...tool,
    inputSchema: tool.inputSchema.strict(),
    timeoutMs,
    retry,
    requiredScopes: [...new Set(tool.requiredScopes)],
  };
}

export interface ToolCallRequest {
  runId: string;
  toolCallId: string;
  idempotencyKey: string;
  organizationId: string;
  actorId: string;
  agent: AgentDefinition;
  toolId: string;
  input: unknown;
  /** Server-derived scopes for this caller and organization. */
  grantedScopes: readonly string[];
  signal?: AbortSignal;
}

export type ExecutionStatus =
  "running" | "waiting_for_approval" | "succeeded" | "failed" | "rejected" | "cancelled";

export interface ExecutionState {
  runId: string;
  toolCallId: string;
  agentId: string;
  toolId: string;
  organizationId: string;
  actorId: string;
  status: ExecutionStatus;
  attempt: number;
  startedAt: string;
  updatedAt: string;
  errorCode?: string;
  approvalId?: string;
}

export type ExecutionEventType =
  | "execution.started"
  | "tool.approval_requested"
  | "tool.approval_granted"
  | "tool.approval_denied"
  | "tool.started"
  | "tool.retrying"
  | "tool.succeeded"
  | "tool.failed"
  | "execution.cancelled"
  | "usage.recorded";

export interface ExecutionEvent {
  eventId: string;
  runId: string;
  toolCallId: string;
  organizationId: string;
  actorId: string;
  agentId: string;
  toolId: string;
  type: ExecutionEventType;
  timestamp: string;
  attempt?: number;
  approvalId?: string;
  errorCode?: string;
  /** Usage only; prompts, inputs, outputs, credentials and PII are excluded. */
  usage?: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    costUsd?: number;
  };
}

export interface ExecutionStore {
  save(state: ExecutionState): Promise<void>;
  get(runId: string, toolCallId: string): Promise<ExecutionState | undefined>;
}

export interface ExecutionAuditSink {
  append(event: ExecutionEvent): Promise<void>;
}

export interface ApprovalRequest {
  approvalId: string;
  runId: string;
  toolCallId: string;
  organizationId: string;
  actorId: string;
  agentId: string;
  toolId: string;
  effect: ToolEffect;
  summary: string;
  idempotencyKey: string;
}

export type ApprovalDecision =
  { status: "approved" } | { status: "denied" } | { status: "pending" };

/** Host adapter presents or resolves a human approval checkpoint. */
export interface ApprovalGateway {
  requestApproval(request: ApprovalRequest): Promise<ApprovalDecision>;
}

export interface IdempotencyStore {
  execute<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<{ value: T; deduplicated: boolean }>;
}

export interface AgentRuntimeOptions {
  tools: readonly AgentTool[];
  executionStore: ExecutionStore;
  auditSink: ExecutionAuditSink;
  approvalGateway: ApprovalGateway;
  idempotencyStore: IdempotencyStore;
  now?: () => Date;
  createId?: () => string;
}

export type ToolExecutionResult<O = unknown> =
  | { status: "succeeded"; result: O; deduplicated: boolean }
  | { status: "waiting_for_approval"; approvalId: string }
  | { status: "rejected"; approvalId: string }
  | { status: "failed"; errorCode: string }
  | { status: "cancelled" };

export class RuntimeError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "RuntimeError";
  }
}

/** Tools mark only explicitly safe transient failures as retryable. */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
    readonly code = "TOOL_FAILED"
  ) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

const APPROVAL_REQUIRED: ReadonlySet<ToolEffect> = new Set([
  "customer_communication",
  "financial",
  "external_write",
  "destructive",
]);

export class AgentRuntime {
  private readonly tools: Map<string, RegisteredTool>;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(private readonly options: AgentRuntimeOptions) {
    this.tools = new Map(options.tools.map(tool => [tool.id, defineTool(tool) as RegisteredTool]));
    if (this.tools.size !== options.tools.length)
      throw new RuntimeError("DUPLICATE_TOOL", "Tool ids must be unique");
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => globalThis.crypto.randomUUID());
  }

  async executeTool<O = unknown>(request: ToolCallRequest): Promise<ToolExecutionResult<O>> {
    const agent = AgentDefinitionSchema.parse(request.agent);
    if (!agent.toolIds.includes(request.toolId))
      throw new RuntimeError("TOOL_NOT_ALLOWED", "Agent cannot use this tool");
    const tool = this.tools.get(request.toolId);
    if (!tool) throw new RuntimeError("TOOL_NOT_REGISTERED", "Tool is not registered");

    const agentScopes = new Set(agent.scopes);
    const availableScopes = request.grantedScopes.filter(scope => agentScopes.has(scope));
    if (tool.requiredScopes.some(scope => !availableScopes.includes(scope))) {
      throw new RuntimeError("SCOPE_DENIED", "Required tool scope is not granted");
    }
    const toolScopes = availableScopes.filter(scope => tool.requiredScopes.includes(scope));

    const input = tool.inputSchema.safeParse(request.input);
    if (!input.success)
      throw new RuntimeError("INVALID_TOOL_INPUT", "Tool input did not match its strict schema");

    const startedAt = this.timestamp();
    const baseState: ExecutionState = {
      runId: request.runId,
      toolCallId: request.toolCallId,
      agentId: agent.id,
      toolId: tool.id,
      organizationId: request.organizationId,
      actorId: request.actorId,
      status: "running",
      attempt: 0,
      startedAt,
      updatedAt: startedAt,
    };
    await this.options.executionStore.save(baseState);
    await this.event(request, "execution.started");
    if (request.signal?.aborted)
      return (await this.cancel(request, baseState, 0)) as ToolExecutionResult<O>;

    if (APPROVAL_REQUIRED.has(tool.effect)) {
      const summary = tool.approvalSummary?.(input.data as never);
      if (typeof summary !== "string" || summary.trim().length === 0 || summary.length > 500) {
        throw new RuntimeError(
          "INVALID_APPROVAL_SUMMARY",
          "Sensitive tool approval summary must be 1 to 500 characters"
        );
      }
      const approvalId = this.createId();
      await this.event(request, "tool.approval_requested", { approvalId });
      const decision = await this.options.approvalGateway.requestApproval({
        approvalId,
        runId: request.runId,
        toolCallId: request.toolCallId,
        organizationId: request.organizationId,
        actorId: request.actorId,
        agentId: agent.id,
        toolId: tool.id,
        effect: tool.effect,
        summary: summary.trim(),
        idempotencyKey: request.idempotencyKey,
      });
      if (decision.status !== "approved") {
        const status = decision.status === "denied" ? "rejected" : "waiting_for_approval";
        await this.saveState({ ...baseState, status, approvalId });
        if (decision.status === "denied")
          await this.event(request, "tool.approval_denied", { approvalId });
        return decision.status === "denied" ? { status, approvalId } : { status, approvalId };
      }
      await this.event(request, "tool.approval_granted", { approvalId });
    }

    const idempotencyKey = JSON.stringify([
      request.organizationId,
      agent.id,
      tool.id,
      request.idempotencyKey,
    ]);
    const outcome = await this.options.idempotencyStore.execute(idempotencyKey, async () =>
      this.invokeWithRetries(tool, request, agent, toolScopes, input.data, baseState)
    );
    if (outcome.deduplicated && outcome.value.status === "succeeded") {
      const priorState = await this.options.executionStore.get(request.runId, request.toolCallId);
      await this.saveState({
        ...baseState,
        status: "succeeded",
        attempt: priorState?.attempt ?? 1,
      });
    }
    return { ...outcome.value, deduplicated: outcome.deduplicated } as ToolExecutionResult<O>;
  }

  /** Record provider usage from the host's @winlerr/ai adapter without logging prompts. */
  async recordUsage(
    request: Pick<
      ToolCallRequest,
      "runId" | "toolCallId" | "organizationId" | "actorId" | "agent" | "toolId"
    >,
    usage: NonNullable<ExecutionEvent["usage"]>
  ): Promise<void> {
    await this.event(request, "usage.recorded", { usage });
  }

  private async invokeWithRetries(
    tool: RegisteredTool,
    request: ToolCallRequest,
    agent: AgentDefinition,
    grantedScopes: readonly string[],
    input: unknown,
    baseState: ExecutionState
  ): Promise<ToolExecutionResult> {
    for (let attempt = 1; attempt <= tool.retry.maxAttempts; attempt += 1) {
      if (request.signal?.aborted) return this.cancel(request, baseState, attempt);
      const startedAt = this.timestamp();
      await this.saveState({ ...baseState, status: "running", attempt, updatedAt: startedAt });
      await this.event(request, "tool.started", { attempt });
      const controller = new AbortController();
      let rejectOnAbort: ((reason: Error) => void) | undefined;
      const abortFromCaller = () => {
        controller.abort(request.signal?.reason);
        rejectOnAbort?.(new ToolExecutionError("Execution cancelled", false, "CANCELLED"));
      };
      request.signal?.addEventListener("abort", abortFromCaller, { once: true });
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const context: ToolExecutionContext = {
          runId: request.runId,
          organizationId: request.organizationId,
          actorId: request.actorId,
          agentId: agent.id,
          grantedScopes,
          signal: controller.signal,
        };
        const result = await Promise.race([
          Promise.resolve().then(() => tool.execute(input as never, context)),
          new Promise<never>((_resolve, reject) => {
            rejectOnAbort = reject;
            if (request.signal?.aborted) abortFromCaller();
          }),
          new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(() => {
              controller.abort(new Error("TOOL_TIMEOUT"));
              reject(new ToolExecutionError("Tool timed out", false, "TOOL_TIMEOUT"));
            }, tool.timeoutMs);
          }),
        ]);
        if (tool.outputSchema) {
          const parsed = tool.outputSchema.safeParse(result);
          if (!parsed.success)
            throw new ToolExecutionError(
              "Tool output failed validation",
              false,
              "INVALID_TOOL_OUTPUT"
            );
        }
        const state = {
          ...baseState,
          status: "succeeded" as const,
          attempt,
          updatedAt: this.timestamp(),
        };
        await this.options.executionStore.save(state);
        await this.event(request, "tool.succeeded", { attempt });
        return { status: "succeeded", result, deduplicated: false };
      } catch (error) {
        if (request.signal?.aborted) return this.cancel(request, baseState, attempt);
        const timedOut = error instanceof ToolExecutionError && error.code === "TOOL_TIMEOUT";
        const retryable = !timedOut && error instanceof ToolExecutionError && error.retryable;
        const errorCode = timedOut
          ? "TOOL_TIMEOUT"
          : error instanceof ToolExecutionError
            ? error.code
            : "TOOL_FAILED";
        if (retryable && attempt < tool.retry.maxAttempts) {
          await this.saveState({
            ...baseState,
            status: "running",
            attempt,
            updatedAt: this.timestamp(),
          });
          await this.event(request, "tool.retrying", { attempt });
          try {
            await this.wait(tool.retry.backoffMs * attempt, request.signal);
          } catch {
            if (request.signal?.aborted) return this.cancel(request, baseState, attempt);
            throw new ToolExecutionError("Retry delay failed", false, "RETRY_DELAY_FAILED");
          }
          continue;
        }
        await this.saveState({
          ...baseState,
          status: "failed",
          attempt,
          updatedAt: this.timestamp(),
          errorCode,
        });
        await this.event(request, "tool.failed", { attempt, errorCode });
        return { status: "failed", errorCode };
      } finally {
        if (timeout) clearTimeout(timeout);
        request.signal?.removeEventListener("abort", abortFromCaller);
      }
    }
    return { status: "failed", errorCode: "TOOL_FAILED" };
  }

  private async cancel(
    request: ToolCallRequest,
    state: ExecutionState,
    attempt: number
  ): Promise<ToolExecutionResult> {
    await this.saveState({
      ...state,
      status: "cancelled",
      attempt,
      updatedAt: this.timestamp(),
      errorCode: "CANCELLED",
    });
    await this.event(request, "execution.cancelled", { attempt, errorCode: "CANCELLED" });
    return { status: "cancelled" };
  }

  private async saveState(state: ExecutionState): Promise<void> {
    await this.options.executionStore.save({ ...state, updatedAt: this.timestamp() });
  }

  private async event(
    request: Pick<
      ToolCallRequest,
      "runId" | "toolCallId" | "organizationId" | "actorId" | "agent" | "toolId"
    >,
    type: ExecutionEventType,
    extra: Pick<ExecutionEvent, "attempt" | "approvalId" | "errorCode" | "usage"> = {}
  ): Promise<void> {
    await this.options.auditSink.append({
      eventId: this.createId(),
      runId: request.runId,
      toolCallId: request.toolCallId,
      organizationId: request.organizationId,
      actorId: request.actorId,
      agentId: request.agent.id,
      toolId: request.toolId,
      type,
      timestamp: this.timestamp(),
      ...extra,
    });
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private async wait(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => signal?.removeEventListener("abort", abort);
      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      const abort = () => {
        clearTimeout(timer);
        cleanup();
        reject(new ToolExecutionError("Execution cancelled", false, "CANCELLED"));
      };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
    });
  }
}

/** Simple test/local adapters; production persistence is supplied by a service. */
export class MemoryExecutionStore implements ExecutionStore {
  private readonly states = new Map<string, ExecutionState>();
  async save(state: ExecutionState): Promise<void> {
    this.states.set(`${state.runId}:${state.toolCallId}`, { ...state });
  }
  async get(runId: string, toolCallId: string): Promise<ExecutionState | undefined> {
    const state = this.states.get(`${runId}:${toolCallId}`);
    return state ? { ...state } : undefined;
  }
}

export class MemoryAuditSink implements ExecutionAuditSink {
  readonly events: ExecutionEvent[] = [];
  async append(event: ExecutionEvent): Promise<void> {
    this.events.push({ ...event });
  }
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly values = new Map<string, Promise<unknown>>();
  async execute<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<{ value: T; deduplicated: boolean }> {
    const existing = this.values.get(key);
    if (existing) return { value: (await existing) as T, deduplicated: true };
    const pending = operation();
    this.values.set(key, pending);
    try {
      const value = await pending;
      if (typeof value === "object" && value !== null && "status" in value) {
        const status = (value as { status?: unknown }).status;
        if (status === "failed" || status === "cancelled") this.values.delete(key);
      }
      return { value, deduplicated: false };
    } catch (error) {
      this.values.delete(key);
      throw error;
    }
  }
}
