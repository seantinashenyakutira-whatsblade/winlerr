import { describe, expect, it } from "vitest";
import {
  callbackUrl,
  loginUrl,
  resolveAppUrl,
  safeNextPath,
} from "../src/redirects.js";

describe("safeNextPath", () => {
  it("passes through plain same-origin paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/get-started?plan=x")).toBe("/get-started?plan=x");
  });

  it("falls back to /dashboard for empty input", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("rejects open-redirect shapes", () => {
    expect(safeNextPath("//evil.com/x")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com/")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeNextPath("/\\evil")).toBe("/dashboard");
  });

  it.each([
    "/.//attacker.example/path",
    "/%2e//attacker.example/path",
    "/%252e//attacker.example/path",
    "/%25252e//attacker.example/path",
    "/workspace/..//attacker.example/path",
    "/\t/attacker.example/path",
    "/%2f%2fattacker.example/path",
    "/%252f%252fattacker.example/path",
    "/%5cattacker.example/path",
    "/dashboard/%0abar",
  ])("rejects ambiguous or dangerous normalized path %s", (input) => {
    const target = safeNextPath(input);
    expect(target).toBe("/dashboard");
    expect(new URL(target, "https://os.example.test").origin).toBe("https://os.example.test");
  });

  it("keeps generated normalization and control-character variants on the original origin", () => {
    const segments = [".", "..", "%2e", "%2E", "%252e", "%25252e", "team/..", "\\", "%5c", "\t", "\n"];
    const bases = ["https://os.example.test", "http://localhost:3000"];
    for (const segment of segments) {
      for (const suffix of ["//attacker.example", "//attacker.example/path?x=1#frag", "/dashboard"]) {
        const target = safeNextPath(`/${segment}${suffix}`);
        for (const base of bases) {
          expect(new URL(target, base).origin).toBe(base);
        }
      }
    }
  });

  it("returns local, idempotent paths for combinations of adversarial fragments", () => {
    const fragments = ["", ".", "..", "%2e", "%252e", "%25252e", "team", "team/..", "%2f", "%5c", "\\", "\t", "\n"];
    const base = "https://os.example.test";
    for (const first of fragments) {
      for (const second of fragments) {
        for (const separator of ["/", "//"]) {
          const target = safeNextPath(`/${first}${separator}${second}//attacker.example/path?x=1#top`);
          expect(new URL(target, base).origin).toBe(base);
          expect(safeNextPath(target)).toBe(target);
        }
      }
    }
  });

  it("preserves ordinary normalized paths, query strings, and fragments", () => {
    expect(safeNextPath("/workspace/../dashboard?tab=team#members")).toBe(
      "/dashboard?tab=team#members",
    );
    expect(safeNextPath("/%C3%A9quipe?next=https%3A%2F%2Fexample.test#top")).toBe(
      "/%C3%A9quipe?next=https%3A%2F%2Fexample.test#top",
    );
  });

  it.each([
    "/login",
    "/login/",
    "/%6cogin",
    "/signup?next=/dashboard",
    "/signup/",
    "/auth/callback",
    "/auth/%63allback",
    "/auth/callback/?code=one-time-code",
  ])("does not loop back to auth route %s", (path) => {
    expect(safeNextPath(path)).toBe("/dashboard");
  });
});

describe("loginUrl", () => {
  it("carries a sanitized next parameter", () => {
    expect(loginUrl("/dashboard")).toBe("/login?next=%2Fdashboard");
    expect(loginUrl("//evil.com")).toBe("/login?next=%2Fdashboard");
    expect(loginUrl("/.//evil.com")).toBe("/login?next=%2Fdashboard");
    expect(loginUrl(null)).toBe("/login?next=%2Fdashboard");
  });
});

describe("callbackUrl", () => {
  it("builds an absolute callback preserving next", () => {
    expect(callbackUrl("https://winlerr.vip/", "/dashboard")).toBe(
      "https://winlerr.vip/auth/callback?next=%2Fdashboard",
    );
    expect(callbackUrl("https://winlerr.vip/", "/.//evil.com")).toBe(
      "https://winlerr.vip/auth/callback?next=%2Fdashboard",
    );
  });
});

describe("resolveAppUrl", () => {
  it("prefers NEXT_PUBLIC_APP_URL and trims slashes", () => {
    expect(
      resolveAppUrl({ NEXT_PUBLIC_APP_URL: "https://a.example/", NEXT_PUBLIC_SITE_URL: "https://b.example" }),
    ).toBe("https://a.example");
  });

  it("falls back to SITE_URL, then null", () => {
    expect(resolveAppUrl({ NEXT_PUBLIC_SITE_URL: "https://b.example" })).toBe("https://b.example");
    expect(resolveAppUrl({})).toBeNull();
  });
});
