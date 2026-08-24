import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  isOk,
  isErr,
  toHttpStatus,
  createError,
  toAppError,
  type Result,
} from "./result.js";

describe("result contract", () => {
  it("creates success result", () => {
    const result = ok({ id: "123" });
    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data.id).toBe("123");
    }
  });

  it("creates error result", () => {
    const error = createError("VALIDATION_ERROR", "invalid input");
    const result = err(error);
    expect(result.ok).toBe(false);
    if (isErr(result)) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toBe("invalid input");
      expect(result.error.status).toBe(400);
    }
  });

  it("typed error codes map to http status", () => {
    expect(toHttpStatus("VALIDATION_ERROR")).toBe(400);
    expect(toHttpStatus("AUTHENTICATION_ERROR")).toBe(401);
    expect(toHttpStatus("AUTHORIZATION_ERROR")).toBe(403);
    expect(toHttpStatus("NOT_FOUND")).toBe(404);
    expect(toHttpStatus("CONFLICT")).toBe(409);
    expect(toHttpStatus("RATE_LIMITED")).toBe(429);
    expect(toHttpStatus("EXTERNAL_SERVICE_ERROR")).toBe(502);
    expect(toHttpStatus("INTERNAL_ERROR")).toBe(500);
  });

  it("createError includes status", () => {
    const e = createError("NOT_FOUND", "not found", { id: "1" });
    expect(e.status).toBe(404);
    expect(e.details).toEqual({ id: "1" });
  });

  it("toAppError converts Error", () => {
    const e = toAppError(new Error("boom"));
    expect(e.code).toBe("INTERNAL_ERROR");
    expect(e.message).toBe("boom");
  });

  it("toAppError preserves AppError", () => {
    const original = createError("CONFLICT", "exists");
    const e = toAppError(original);
    expect(e.code).toBe("CONFLICT");
    expect(e.message).toBe("exists");
  });

  it("Result type narrows correctly", () => {
    const success: Result<number> = ok(42);
    const failure: Result<number> = err(
      createError("INTERNAL_ERROR", "fail")
    );

    expect(isOk(success)).toBe(true);
    expect(isErr(success)).toBe(false);
    expect(isOk(failure)).toBe(false);
    expect(isErr(failure)).toBe(true);
  });
});
