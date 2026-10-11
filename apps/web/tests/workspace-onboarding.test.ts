import { describe, expect, it, vi } from "vitest";
import type { OrganizationWithRole } from "@winlerr/workspace";
import {
  slugFromWorkspaceName,
  submitWorkspace,
  type CreateOrganization,
} from "../src/lib/workspace-onboarding";

const organization: OrganizationWithRole = {
  id: "org-1",
  created_at: "2026-10-11T00:00:00.000Z",
  name: "Lumwana Traders",
  slug: "lumwana-traders",
  created_by: "user-1",
  role: "owner",
};

describe("workspace onboarding submission", () => {
  it("sends the agreed fields and returns only a confirmed organization", async () => {
    const action = vi.fn<CreateOrganization>().mockResolvedValue({
      ok: true,
      data: { organization, role: "owner" },
    });

    await expect(
      submitWorkspace({ name: "Lumwana Traders", slug: "lumwana-traders" }, action),
    ).resolves.toEqual({ ok: true, organization });
    expect(action).toHaveBeenCalledWith({ name: "Lumwana Traders", slug: "lumwana-traders" });
  });

  it("does not report success when the action returns no organization", async () => {
    const action = vi.fn<CreateOrganization>().mockResolvedValue({ ok: true });
    await expect(
      submitWorkspace({ name: "Lumwana Traders", slug: "lumwana-traders" }, action),
    ).resolves.toEqual({ ok: false, error: "unknown" });
  });

  it("does not call the action for invalid name or slug values", async () => {
    const action = vi.fn<CreateOrganization>();

    await expect(submitWorkspace({ name: " ", slug: "valid-slug" }, action)).resolves.toEqual({
      ok: false,
      error: "invalid-name",
    });
    await expect(submitWorkspace({ name: "A workspace", slug: "not a slug" }, action)).resolves.toEqual({
      ok: false,
      error: "invalid-slug",
    });
    expect(action).not.toHaveBeenCalled();
  });

  it.each(["slug-taken", "unauthorized", "unknown"] as const)(
    "preserves the backend %s error without reporting success",
    async (error) => {
      const action = vi.fn<CreateOrganization>().mockResolvedValue({ ok: false, error });
      await expect(
        submitWorkspace({ name: "Lumwana Traders", slug: "lumwana-traders" }, action),
      ).resolves.toEqual({ ok: false, error });
    },
  );

  it("maps unexpected action failures to unknown", async () => {
    const action = vi.fn<CreateOrganization>().mockRejectedValue(new Error("unavailable"));
    await expect(
      submitWorkspace({ name: "Lumwana Traders", slug: "lumwana-traders" }, action),
    ).resolves.toEqual({ ok: false, error: "unknown" });
  });
});

describe("workspace slug suggestion", () => {
  it("normalizes a workspace name into a lowercase hyphenated address", () => {
    expect(slugFromWorkspaceName("  Café & Sons, Ltd. ")).toBe("cafe-sons-ltd");
  });
});
