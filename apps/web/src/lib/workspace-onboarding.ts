import {
  createOrganizationSchema,
  type OrganizationWithRole,
  type WorkspaceErrorCode,
} from "@winlerr/workspace";
import type { WorkspaceActionResult } from "@/lib/workspace-actions";

type CreatedOrganization = {
  organization: OrganizationWithRole;
  role: "owner";
};

export type CreateOrganization = (
  input: { name: string; slug: string },
) => Promise<WorkspaceActionResult<CreatedOrganization>>;

export type WorkspaceSubmissionResult =
  | { ok: true; organization: OrganizationWithRole }
  | { ok: false; error: WorkspaceErrorCode };

/** Validates the form and submits through an injected server action. */
export async function submitWorkspace(
  input: { name: string; slug: string },
  createOrganization: CreateOrganization,
): Promise<WorkspaceSubmissionResult> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { ok: false, error: field === "name" ? "invalid-name" : "invalid-slug" };
  }

  try {
    const result = await createOrganization(parsed.data);
    if (!result.ok || !result.data?.organization) {
      return { ok: false, error: result.error ?? "unknown" };
    }
    return { ok: true, organization: result.data.organization };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export function slugFromWorkspaceName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}
