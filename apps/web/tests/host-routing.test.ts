import { describe, expect, it } from "vitest";
import { safeNextPath } from "@winlerr/auth";
import {
  OS_ENTRY_PATH,
  getHostKind,
  mapLegacyPath,
  normalizeHost,
  resolveRedirect,
  resolveRewrite,
} from "../src/lib/hosts";

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

describe("resolveRewrite (root rewrite only)", () => {
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
      "/api/leads",
      "/api/auth/session",
    ];
    for (const host of ["os.winlerr.vip", "www.winlerr.vip"]) {
      for (const path of marketingPaths) {
        expect(resolveRewrite(host, path)).toBeNull();
      }
    }
  });

  it("rewrites legacy /winlaos aliases internally on OS and unknown hosts", () => {
    expect(resolveRewrite("os.winlerr.vip", "/winlaos")).toBe("/");
    expect(resolveRewrite("os.winlerr.vip", "/winlaos/onboarding")).toBe("/winlerros/onboarding");
    expect(resolveRewrite("os.winlerr.vip", "/winlaos/preview")).toBe("/winlerros/preview");
    expect(resolveRewrite("localhost:3000", "/winlaos")).toBe("/");
    expect(resolveRewrite("winlerr-git-x.vercel.app", "/winlaos/preview")).toBe("/winlerros/preview");
  });

  it("never rewrites legacy aliases on marketing hosts (they redirect instead)", () => {
    for (const path of ["/winlaos", "/winlaos/onboarding", "/winlaos/preview", "/winlerros"]) {
      expect(resolveRewrite("www.winlerr.vip", path)).toBeNull();
    }
  });

  it("never rewrites /winlerros itself (would loop back to /)", () => {
    for (const host of ["os.winlerr.vip", "www.winlerr.vip", "localhost:3000"]) {
      expect(resolveRewrite(host, "/winlerros")).toBeNull();
    }
  });
});

describe("mapLegacyPath", () => {
  it("maps the legacy entry to the OS root", () => {
    expect(mapLegacyPath("/winlerros")).toBe("/");
    expect(mapLegacyPath("/winlaos")).toBe("/");
  });

  it("maps legacy aliases onto OS destinations without losing the page", () => {
    expect(mapLegacyPath("/winlaos/onboarding")).toBe("/winlerros/onboarding");
    expect(mapLegacyPath("/winlaos/preview")).toBe("/winlerros/preview");
    expect(mapLegacyPath("/winlerros/onboarding")).toBe("/winlerros/onboarding");
    expect(mapLegacyPath("/winlerros/preview")).toBe("/winlerros/preview");
  });

  it("leaves app, marketing, and API paths alone", () => {
    for (const path of ["/login", "/dashboard", "/about", "/api/leads", "/"]) {
      expect(mapLegacyPath(path)).toBeNull();
    }
  });
});

describe("resolveRedirect (marketing app routes and legacy paths to OS)", () => {
  const OS = "os.winlerr.vip";

  it("moves app routes from marketing hosts to the OS origin", () => {
    for (const host of ["www.winlerr.vip", "winlerr.vip", "winlerr.vercel.app"]) {
      for (const path of ["/login", "/signup", "/auth/callback", "/dashboard", "/dashboard/setup"]) {
        expect(resolveRedirect(host, path, "GET")).toEqual({ hostname: OS, pathname: path });
      }
    }
  });

  it("moves legacy entry and alias paths to OS destinations", () => {
    expect(resolveRedirect("www.winlerr.vip", "/winlerros", "GET")).toEqual({ hostname: OS, pathname: "/" });
    expect(resolveRedirect("www.winlerr.vip", "/winlerros/onboarding", "GET")).toEqual({
      hostname: OS,
      pathname: "/winlerros/onboarding",
    });
    expect(resolveRedirect("www.winlerr.vip", "/winlaos", "GET")).toEqual({ hostname: OS, pathname: "/" });
    expect(resolveRedirect("www.winlerr.vip", "/winlaos/preview", "HEAD")).toEqual({
      hostname: OS,
      pathname: "/winlerros/preview",
    });
  });

  it("never redirects POST/PUT/DELETE (API and form posts stay put)", () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      expect(resolveRedirect("www.winlerr.vip", "/login", method)).toBeNull();
      expect(resolveRedirect("www.winlerr.vip", "/api/auth/session", method)).toBeNull();
      expect(resolveRedirect("www.winlerr.vip", "/winlerros", method)).toBeNull();
    }
  });

  it("never redirects on the OS host (no loops back to www)", () => {
    for (const path of ["/", "/login", "/dashboard", "/winlerros", "/api/leads"]) {
      expect(resolveRedirect("os.winlerr.vip", path, "GET")).toBeNull();
    }
  });

  it("never redirects unknown hosts (localhost, previews keep working)", () => {
    for (const host of ["localhost:3000", "127.0.0.1:3000", "winlerr-git-x.vercel.app", "evil.example", null]) {
      expect(resolveRedirect(host, "/login", "GET")).toBeNull();
      expect(resolveRedirect(host, "/winlerros", "GET")).toBeNull();
      expect(resolveRedirect(host, "/", "GET")).toBeNull();
    }
  });

  it("never redirects marketing pages or API routes", () => {
    for (const path of ["/", "/about", "/systems", "/docs", "/get-started", "/api/leads", "/api/auth/session", "/sitemap.xml"]) {
      expect(resolveRedirect("www.winlerr.vip", path, "GET")).toBeNull();
    }
  });

  it("does not confuse lookalike paths with app routes", () => {
    expect(resolveRedirect("www.winlerr.vip", "/dashboardsetup", "GET")).toBeNull();
    expect(resolveRedirect("www.winlerr.vip", "/login-help", "GET")).toBeNull();
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
