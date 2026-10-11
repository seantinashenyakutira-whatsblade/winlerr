/**
 * @winlerr/workspace — organization lifecycle against injected ports.
 *
 * The `WorkspaceDb` port expresses intent (find/insert/list), so this
 * module is fully unit-testable with in-memory fakes and carries no
 * database driver. The production adapter (PostgREST calls with the
 * session-authenticated client) lives in the app's server actions.
 *
 * Security invariants (also enforced by RLS — this layer is defense in
 * depth, never the sole enforcement):
 * - role is ALWAYS forced to 'owner' on creation; it is not even part of
 *   the input type, so no caller can smuggle another role in.
 * - every operation requires a userId; membership rows can only ever
 *   reference the calling user (user_id is set here, never from input).
 * - reads only ever return organizations the caller belongs to.
 */
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "./validation.js";
import type {
  Organization,
  OrganizationMembership,
  OrganizationWithRole,
  WorkspaceErrorCode,
  WorkspaceResult,
} from "./types.js";

export interface OrgInsertRow {
  name: string;
  slug: string;
  created_by: string;
}

export interface MembershipInsertRow {
  org_id: string;
  user_id: string;
  role: "owner";
}

export interface DbCallError {
  code?: string;
  message: string;
}

export interface WorkspaceDb {
  findOrgBySlug(slug: string): Promise<{ org: Organization | null; error?: DbCallError }>;
  findOrgById(id: string): Promise<{ org: Organization | null; error?: DbCallError }>;
  insertOrganization(row: OrgInsertRow): Promise<{ org: Organization | null; code?: string }>;
  insertMembership(row: MembershipInsertRow): Promise<{ membership: OrganizationMembership | null; code?: string }>;
  listMemberships(userId: string): Promise<{ memberships: OrganizationMembership[] | null; error?: DbCallError }>;
  findMembership(orgId: string, userId: string): Promise<{ membership: OrganizationMembership | null; error?: DbCallError }>;
}

export interface WorkspaceContext {
  db: WorkspaceDb;
  /** Authenticated user id from the verified session. Null = signed out. */
  userId: string | null;
}

function unauthorized<T>(): WorkspaceResult<T> {
  return { ok: false, error: "unauthorized" };
}

function isUniqueViolation(code?: string): boolean {
  return code === "23505";
}

export async function createOrganization(
  ctx: WorkspaceContext,
  input: { name: string; slug: string },
): Promise<WorkspaceResult<{ organization: Organization; membership: OrganizationMembership }>> {
  if (!ctx.userId) return unauthorized();
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    const code: WorkspaceErrorCode = field === "name" ? "invalid-name" : "invalid-slug";
    return { ok: false, error: code };
  }
  const data: CreateOrganizationInput = parsed.data;

  const existing = await ctx.db.findOrgBySlug(data.slug);
  if (existing.error) return { ok: false, error: "unknown" };
  if (existing.org) return { ok: false, error: "slug-taken" };

  const created = await ctx.db.insertOrganization({
    name: data.name,
    slug: data.slug,
    created_by: ctx.userId,
  });
  if (!created.org) {
    if (isUniqueViolation(created.code)) return { ok: false, error: "slug-taken" };
    return { ok: false, error: "unknown" };
  }

  const membered = await ctx.db.insertMembership({
    org_id: created.org.id,
    user_id: ctx.userId,
    role: "owner",
  });
  if (!membered.membership) {
    if (isUniqueViolation(membered.code)) return { ok: false, error: "already-member" };
    return { ok: false, error: "unknown" };
  }
  return { ok: true, data: { organization: created.org, membership: membered.membership } };
}

export async function listMyOrganizations(
  ctx: WorkspaceContext,
): Promise<WorkspaceResult<OrganizationWithRole[]>> {
  if (!ctx.userId) return unauthorized();
  const listed = await ctx.db.listMemberships(ctx.userId);
  if (!listed.memberships) return { ok: false, error: "unknown" };
  const out: OrganizationWithRole[] = [];
  for (const membership of listed.memberships) {
    if (membership.user_id !== ctx.userId) continue;
    const found = await ctx.db.findOrgById(membership.org_id);
    if (found.error || !found.org) continue;
    out.push({ ...found.org, role: membership.role });
  }
  return { ok: true, data: out };
}

export async function getOrganization(
  ctx: WorkspaceContext,
  orgId: string,
): Promise<WorkspaceResult<OrganizationWithRole>> {
  if (!ctx.userId) return unauthorized();
  if (!orgId) return { ok: false, error: "not-found" };
  const membership = await ctx.db.findMembership(orgId, ctx.userId);
  if (membership.error) return { ok: false, error: "unknown" };
  if (!membership.membership || membership.membership.user_id !== ctx.userId) {
    // Deliberately not distinguishing missing-org from non-member:
    // no organization-existence oracle for outsiders.
    return { ok: false, error: "not-member" };
  }
  const found = await ctx.db.findOrgById(orgId);
  if (found.error || !found.org) return { ok: false, error: "not-member" };
  return { ok: true, data: { ...found.org, role: membership.membership.role } };
}
