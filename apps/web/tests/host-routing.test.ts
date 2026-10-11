import { describe, expect, it } from "vitest";
import { safeNextPath } from "@winlerr/auth";
import { OS_ENTRY_PATH, getHostKind, normalizeHost, resolveRewrite } from "../src/lib/hosts";

describe("normalizeHost", () => {
  it("lowercases and trims the authoritative host header", () => {
    expect(normalizeHost("OS.Winlerr.VIP")).toBe("os.winlerr.vip");
    expect(normalizeHost("  www.winlerr.vip  ")).toBe("www.winlerr.vip");
  });

  it("strips ports and a trailing dot", () => {
    expect(normalizeHost("os.winlerr.vip:443")).toBe("os.winlerr.vip");
    expect(normalizeHost("www.winlerr.vip.")).toBe("www.winlerr.vip");
    expect(normalizeHost("localhost:3000")).toBe("localhost");
  });

  it("returns empty for missing hosts", () => {
    expect(normalizeHost(null)).toBe("");
    expect(normalizeHost(undefined)).toBe("");
    expect(normalizeHost("")).toBe("");
  });
});

describe("getHostKind", () => {
  it("recognizes the OS host", () => {
    expect(getHostKind("os.winlerr.vip")).toBe("os");
    expect(getHostKind("OS.WINLERR.VIP:443")).toBe("os");
  });

  it("recognizes the marketing hosts", () => {
    expect(getHostKind("www.winlerr.vip")).toBe("marketing");
    expect(getHostKind("winlerr.vip")).toBe("marketing");
    expect(getHostKind("winlerr.vercel.app")).toBe("marketing");
  });

  it("treats localhost, previews, and unknown hosts as passthrough", () => {
    expect(getHostKind("localhost:3000")).toBe("unknown");
    expect(getHostKind("127.0.0.1:3000")).toBe("unknown");
    expect(getHostKind("winlerr-git-branch-abc123.vercel.app")).toBe("unknown");
    expect(getHostKind("evil.example")).toBe("unknown");
    expect(getHostKind(null)).toBe("unknown");
  });
});

describe("resolveRewrite (root rewrite only, no host redirects)", () => {
  it("rewrites the OS root to the WinlerrOS entry page", () => {
    expect(resolveRewrite("os.winlerr.vip", "/")).toBe(OS_ENTRY_PATH);
    expect(resolveRewrite("os.winlerr.vip", "/")).toBe("/winlerros");
  });

  it("is case- and port-insensitive for the OS host", () => {
    expect(resolveRewrite("OS.WINLERR.VIP", "/")).toBe("/winlerros");
    expect(resolveRewrite("os.winlerr.vip:443", "/")).toBe("/winlerros");
  });

  it("preserves the marketing homepage on www and apex", () => {
    expect(resolveRewrite("www.winlerr.vip", "/")).toBeNull();
    expect(resolveRewrite("winlerr.vip", "/")).toBeNull();
    expect(resolveRewrite("winlerr.vercel.app", "/")).toBeNull();
  });

  it("leaves local and preview roots untouched", () => {
    expect(resolveRewrite("localhost:3000", "/")).toBeNull();
    expect(resolveRewrite("winlerr-git-x.vercel.app", "/")).toBeNull();
  });

  it("preserves auth callbacks and session handoffs on the OS host", () => {
    for (const path of ["/login", "/signup", "/auth/callback", "/api/auth/session"]) {
      expect(resolveRewrite("os.winlerr.vip", path)).toBeNull();
    }
  });

  it("preserves the protected dashboard and workspace setup on the OS host", () => {
    expect(resolveRewrite("os.winlerr.vip", "/dashboard")).toBeNull();
    expect(resolveRewrite("os.winlerr.vip", "/dashboard/setup")).toBeNull();
  });

  it("preserves marketing routes and deep links on both hosts", () => {
    const marketingPaths = [
      "/about",
      "/systems",
      "/docs",
      "/get-started",
      "/winlerros",
      "/winlerros/onboarding",
      "/winlerros/preview",
    ];
    for (const host of ["os.winlerr.vip", "www.winlerr.vip"]) {
      for (const path of marketingPaths) {
        expect(resolveRewrite(host, path)).toBeNull();
      }
    }
  });

  it("preserves compatibility aliases for the legacy /winlaos paths", () => {
    for (const path of ["/winlaos", "/winlaos/onboarding", "/winlaos/preview"]) {
      expect(resolveRewrite("os.winlerr.vip", path)).toBeNull();
      expect(resolveRewrite("www.winlerr.vip", path)).toBeNull();
    }
  });
});

describe("safe redirects are preserved alongside host routing", () => {
  it("keeps same-origin next targets and rejects open redirects", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard/setup")).toBe("/dashboard/setup");
    expect(safeNextPath("//evil.example/x")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example/")).toBe("/dashboard");
  });

  it("never loops back onto the auth pages", () => {
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/signup?next=/dashboard")).toBe("/dashboard");
  });
});
