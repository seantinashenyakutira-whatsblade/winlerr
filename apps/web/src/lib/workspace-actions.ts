"use server";

/**
 * Workspace Server Actions — typed API for Codex's onboarding form.
 * Thin boundary: session + PostgREST adapter here, all rules in
 * @winlerr/workspace (validated, role-forced, tenant-scoped).
 * No service-role key is used or needed — RLS + anon key suffice.
 */
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  WORKSPACE_ERROR_COPY,
  createOrganization as coreCreate,
  getOrganization as coreGet,
  listMyOrganizations as coreList,
  type OrganizationMembership,
  type OrganizationWithRole,
  type WorkspaceDb,
  type WorkspaceErrorCode,
} from "@winlerr/workspace";
import { getViewer } from "@/lib/auth-actions";

export interface WorkspaceActionResult<T> {
  ok: boolean;
  data?: T;
  error?: WorkspaceErrorCode;
  errorMessage?: string;
}

function fail<T>(error: WorkspaceErrorCode): WorkspaceActionResult<T> {
  return { ok: false, error, errorMessage: WORKSPACE_ERROR_COPY[error] };
}

async function createAdapter(): Promise<{ db: WorkspaceDb; userId: string } | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !anonKey) return null;
  const store = await cookies();
  const accessToken = store.get("winlerr-sb-access")?.value;
  const refreshToken = store.get("winlerr-sb-refresh")?.value;
  if (!accessToken || !refreshToken) return null;
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) return null;
  const userId = viewer.id;
  const db: WorkspaceDb = {
    findOrgBySlug: async (slug) =>
      client
        .from("organizations")
        .select("id,created_at,name,slug,created_by")
        .eq("slug", slug)
        .maybeSingle()
        .then((r) => ({ org: (r.data as OrganizationWithRole | null) ?? null, error: r.error ? { message: r.error.message, code: r.error.code } : undefined })),
    findOrgById: async (id) =>
      client
        .from("organizations")
        .select("id,created_at,name,slug,created_by")
        .eq("id", id)
        .maybeSingle()
        .then((r) => ({ org: (r.data as OrganizationWithRole | null) ?? null, error: r.error ? { message: r.error.message, code: r.error.code } : undefined })),
    insertOrganization: async (row) =>
      client
        .from("organizations")
        .insert(row)
        .select("id,created_at,name,slug,created_by")
        .single()
        .then((r) => ({ org: (r.data as OrganizationWithRole | null) ?? null, code: r.error?.code })),
    insertMembership: async (row) =>
      client
        .from("organization_members")
        .insert(row)
        .select("org_id,user_id,role,created_at")
        .single()
        .then((r) => ({
          membership: (r.data as OrganizationMembership | null) ?? null,
          code: r.error?.code,
        })),
    listMemberships: async (uid) =>
      client
        .from("organization_members")
        .select("org_id,user_id,role,created_at")
        .eq("user_id", uid)
        .then((r) => ({
          memberships: (r.data as OrganizationMembership[] | null) ?? null,
          error: r.error ? { message: r.error.message, code: r.error.code } : undefined,
        })),
    findMembership: async (orgId, uid) =>
      client
        .from("organization_members")
        .select("org_id,user_id,role,created_at")
        .eq("org_id", orgId)
        .eq("user_id", uid)
        .maybeSingle()
        .then((r) => ({
          membership: (r.data as OrganizationMembership | null) ?? null,
          error: r.error ? { message: r.error.message, code: r.error.code } : undefined,
        })),
  };
  return { db, userId };
}

export async function createOrganizationAction(input: {
  name: string;
  slug: string;
}): Promise<WorkspaceActionResult<{ organization: OrganizationWithRole; role: "owner" }>> {
  const adapter = await createAdapter();
  if (!adapter) return fail("unauthorized");
  const result = await coreCreate(adapter, input);
  if (!result.ok) return fail(result.error);
  return {
    ok: true,
    data: {
      organization: { ...result.data.organization, role: "owner" as const },
      role: "owner" as const,
    },
  };
}

export async function listOrganizationsAction(): Promise<WorkspaceActionResult<OrganizationWithRole[]>> {
  const adapter = await createAdapter();
  if (!adapter) return fail("unauthorized");
  const result = await coreList(adapter);
  if (!result.ok) return fail(result.error);
  return { ok: true, data: result.data };
}

export async function getOrganizationAction(
  orgId: string,
): Promise<WorkspaceActionResult<OrganizationWithRole>> {
  const adapter = await createAdapter();
  if (!adapter) return fail("unauthorized");
  const result = await coreGet(adapter, orgId);
  if (!result.ok) return fail(result.error);
  return { ok: true, data: result.data };
}
