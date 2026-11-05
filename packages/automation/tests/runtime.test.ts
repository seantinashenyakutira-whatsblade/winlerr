import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AgentRuntime,
  defineAgent,
  defineTool,
  MemoryAuditSink,
  MemoryExecutionStore,
  MemoryIdempotencyStore,
  ToolExecutionError,
  type AgentTool,
  type ApprovalDecision,
  type ToolCallRequest,
} from "../src/index.js";

const agent = defineAgent({
  id: "sales-assistant",
  version: "1",
  name: "Sales assistant",
  instructionsRef: "prompts/sales@1",
  modelRoute: "default",
  toolIds: ["lookup", "send-message", "retry"],
  scopes: ["leads:read", "messages:send"],
});

function makeRequest(overrides: Partial<ToolCallRequest> = {}): ToolCallRequest {
  return {
    runId: "run-1",
    toolCallId: "call-1",
    idempotencyKey: "once-1",
    organizationId: "org-1",
    actorId: "user-1",
    agent,
    toolId: "lookup",
    input: { query: "Ada" },
    grantedScopes: ["leads:read"],
    ...overrides,
  };
}

function lookupTool(
  execute = vi.fn((input: { query: string }) => ({ matches: [input.query] }))
): AgentTool {
  return defineTool({
    id: "lookup",
    description: "Look up a lead in a local test fixture.",
    inputSchema: z.object({ query: z.string().min(1) }),
    outputSchema: z.object({ matches: z.array(z.string()) }).strict(),
    requiredScopes: ["leads:read"],
    effect: "read",
    timeoutMs: 1_000,
    retry: { maxAttempts: 1, backoffMs: 0 },
    execute,
  });
}

function makeRuntime(
  options: {
    tools?: readonly AgentTool[];
    approval?: ApprovalDecision;
  } = {}
) {
  const executionStore = new MemoryExecutionStore();
  const auditSink = new MemoryAuditSink();
  const requestApproval = vi.fn().mockResolvedValue(options.approval ?? { status: "approved" });
  const runtime = new AgentRuntime({
    tools: options.tools ?? [lookupTool()],
    executionStore,
    auditSink,
    approvalGateway: { requestApproval },
    idempotencyStore: new MemoryIdempotencyStore(),
    createId: (() => {
      let id = 0;
      return () => `id-${++id}`;
    })(),
  });
  return { runtime, executionStore, auditSink, requestApproval };
}

describe("AgentRuntime", () => {
  it("validates strict input, executes one local tool and stores state without input data in audit", async () => {
    const execute = vi.fn((input: { query: string }) => ({ matches: [input.query] }));
    const { runtime, executionStore, auditSink } = makeRuntime({ tools: [lookupTool(execute)] });

    const result = await runtime.executeTool(
      makeRequest({ grantedScopes: ["leads:read", "messages:send"] })
    );

    expect(result).toEqual({
      status: "succeeded",
      result: { matches: ["Ada"] },
      deduplicated: false,
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      { query: "Ada" },
      expect.objectContaining({ grantedScopes: ["leads:read"] })
    );
    expect(await executionStore.get("run-1", "call-1")).toMatchObject({
      status: "succeeded",
      attempt: 1,
    });
    expect(auditSink.events.map(event => event.type)).toEqual([
      "execution.started",
      "tool.started",
      "tool.succeeded",
    ]);
    expect(JSON.stringify(auditSink.events)).not.toContain("Ada");
  });

  it("rejects unknown input keys and missing scopes before invoking a tool", async () => {
    const execute = vi.fn();
    const { runtime } = makeRuntime({ tools: [lookupTool(execute)] });

    await expect(
      runtime.executeTool(makeRequest({ input: { query: "Ada", admin: true } }))
    ).rejects.toMatchObject({
      code: "INVALID_TOOL_INPUT",
    });
    await expect(runtime.executeTool(makeRequest({ grantedScopes: [] }))).rejects.toMatchObject({
      code: "SCOPE_DENIED",
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("holds sensitive actions at an approval checkpoint and executes only after approval", async () => {
    const send = vi.fn();
    const tool = defineTool({
      id: "send-message",
      description: "Send a customer message.",
      inputSchema: z.object({ message: z.string() }),
      requiredScopes: ["messages:send"],
      effect: "customer_communication",
      approvalSummary: ({ message }) => `Send customer message: ${message}`,
      timeoutMs: 1_000,
      retry: { maxAttempts: 1, backoffMs: 0 },
      execute: send,
    });
    const pending = makeRuntime({ tools: [tool], approval: { status: "pending" } });
    const waiting = await pending.runtime.executeTool(
      makeRequest({
        toolId: "send-message",
        input: { message: "Hello" },
        grantedScopes: ["messages:send"],
      })
    );
    expect(waiting).toMatchObject({ status: "waiting_for_approval" });
    expect(send).not.toHaveBeenCalled();
    expect(pending.requestApproval).toHaveBeenCalledWith(
      expect.objectContaining({ summary: "Send customer message: Hello" })
    );
    expect(JSON.stringify(pending.auditSink.events)).not.toContain("Hello");
    expect(await pending.executionStore.get("run-1", "call-1")).toMatchObject({
      status: "waiting_for_approval",
    });

    const approved = makeRuntime({ tools: [tool] });
    const result = await approved.runtime.executeTool(
      makeRequest({
        toolId: "send-message",
        input: { message: "Hello" },
        grantedScopes: ["messages:send"],
      })
    );
    expect(result.status).toBe("succeeded");
    expect(send).toHaveBeenCalledTimes(1);
    expect(approved.requestApproval).toHaveBeenCalledTimes(1);
  });

  it("records denial and does not execute a sensitive action", async () => {
    const execute = vi.fn();
    const tool = defineTool({
      id: "send-message",
      description: "Send a customer message.",
      inputSchema: z.object({ message: z.string() }),
      requiredScopes: ["messages:send"],
      effect: "customer_communication",
      approvalSummary: ({ message }) => `Send customer message: ${message}`,
      timeoutMs: 1_000,
      retry: { maxAttempts: 1, backoffMs: 0 },
      execute,
    });
    const { runtime, executionStore, auditSink } = makeRuntime({
      tools: [tool],
      approval: { status: "denied" },
    });
    const result = await runtime.executeTool(
      makeRequest({
        toolId: "send-message",
        input: { message: "Hello" },
        grantedScopes: ["messages:send"],
      })
    );
    expect(result).toMatchObject({ status: "rejected" });
    expect(execute).not.toHaveBeenCalled();
    expect(await executionStore.get("run-1", "call-1")).toMatchObject({ status: "rejected" });
    expect(auditSink.events.some(event => event.type === "tool.approval_denied")).toBe(true);
  });

  it("retries only explicitly retryable tool failures within the configured bound", async () => {
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new ToolExecutionError("temporary", true, "TEMPORARY"))
      .mockResolvedValue({ matches: ["Ada"] });
    const tool = defineTool({
      ...lookupTool(execute),
      retry: { maxAttempts: 2, backoffMs: 0 },
    });
    const { runtime, auditSink } = makeRuntime({ tools: [tool] });

    const result = await runtime.executeTool(makeRequest());

    expect(result.status).toBe("succeeded");
    expect(execute).toHaveBeenCalledTimes(2);
    expect(auditSink.events.some(event => event.type === "tool.retrying")).toBe(true);
  });

  it("times out a non-responsive tool and records a failed state", async () => {
    const tool = defineTool({
      ...lookupTool(() => new Promise(() => undefined)),
      timeoutMs: 5,
    });
    const { runtime, executionStore } = makeRuntime({ tools: [tool] });
    const result = await runtime.executeTool(makeRequest());
    expect(result).toEqual({ status: "failed", errorCode: "TOOL_TIMEOUT", deduplicated: false });
    expect(await executionStore.get("run-1", "call-1")).toMatchObject({
      status: "failed",
      errorCode: "TOOL_TIMEOUT",
    });
  });

  it("supports cancellation for tools that do not resolve on their own", async () => {
    const tool = defineTool({
      ...lookupTool(() => new Promise(() => undefined)),
      timeoutMs: 1_000,
    });
    const { runtime, executionStore } = makeRuntime({ tools: [tool] });
    const controller = new AbortController();
    const execution = runtime.executeTool(makeRequest({ signal: controller.signal }));
    controller.abort();
    expect(await execution).toMatchObject({ status: "cancelled" });
    expect(await executionStore.get("run-1", "call-1")).toMatchObject({ status: "cancelled" });
  });

  it("deduplicates completed calls by organization, agent, tool and idempotency key", async () => {
    const execute = vi.fn((input: { query: string }) => ({ matches: [input.query] }));
    const { runtime } = makeRuntime({ tools: [lookupTool(execute)] });
    await runtime.executeTool(makeRequest());
    const duplicate = await runtime.executeTool(makeRequest());
    expect(duplicate).toMatchObject({ status: "succeeded", deduplicated: true });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("records usage metadata without content fields", async () => {
    const { runtime, auditSink } = makeRuntime();
    await runtime.recordUsage(makeRequest(), {
      provider: "fake",
      model: "unit-test",
      promptTokens: 8,
      completionTokens: 3,
      costUsd: 0.0001,
    });
    expect(auditSink.events.at(-1)).toMatchObject({
      type: "usage.recorded",
      usage: {
        provider: "fake",
        model: "unit-test",
        promptTokens: 8,
        completionTokens: 3,
        costUsd: 0.0001,
      },
    });
    expect(auditSink.events.at(-1)).not.toHaveProperty("input");
  });
});
