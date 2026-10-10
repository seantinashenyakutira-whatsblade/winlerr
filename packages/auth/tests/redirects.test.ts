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

  it("never loops back onto auth pages", () => {
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/signup?next=/dashboard")).toBe("/dashboard");
  });
});

describe("loginUrl", () => {
  it("carries a sanitized next parameter", () => {
    expect(loginUrl("/dashboard")).toBe("/login?next=%2Fdashboard");
    expect(loginUrl("//evil.com")).toBe("/login?next=%2Fdashboard");
    expect(loginUrl(null)).toBe("/login?next=%2Fdashboard");
  });
});

describe("callbackUrl", () => {
  it("builds an absolute callback preserving next", () => {
    expect(callbackUrl("https://winlerr.vip/", "/dashboard")).toBe(
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
