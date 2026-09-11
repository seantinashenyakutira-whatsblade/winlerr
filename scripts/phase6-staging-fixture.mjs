import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const TARGET_PROJECT_REF = "xvwgumawzoqjduvtnlcs";
export const TARGET_URL = `https://${TARGET_PROJECT_REF}.supabase.co`;
export const MANIFEST_PATH = "/tmp/winlerr_phase6_fixture_manifest.json";
export const MCP_INPUT_PATH = "/tmp/winlerr_phase6_fixture_mcp_input.json";

export function assertStagingTarget() {
  if (process.env.WINLERR_STAGING_PROJECT_REF !== TARGET_PROJECT_REF) {
    throw new Error("Phase 6 fixture refused: staging project ref mismatch");
  }
  if (
    process.env.WINLERR_STAGING_SUPABASE_URL &&
    process.env.WINLERR_STAGING_SUPABASE_URL !== TARGET_URL
  ) {
    throw new Error("Phase 6 fixture refused: staging URL mismatch");
  }
}

export function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

export function buildFixture() {
  const orgA = randomUUID();
  const orgB = randomUUID();
  const roles = ["owner", "admin", "member", "viewer"];
  const orgAUsers = Object.fromEntries(roles.map(role => [role, randomUUID()]));
  const userB = randomUUID();
  const users = {
    ...Object.fromEntries(
      roles.map(role => [
        role,
        {
          id: orgAUsers[role],
          email: `phase6-${role}-${orgAUsers[role]}@gmail.com`,
        },
      ])
    ),
    tenantB: {
      id: userB,
      email: `phase6-tenant-b-${userB}@gmail.com`,
    },
  };

  const userRows = Object.values(users)
    .map(
      user => `(
        ${sqlLiteral(user.id)}::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        ${sqlLiteral(user.email)},
        crypt('Phase6-' || ${sqlLiteral(user.id)}, gen_salt('bf')),
        now(),
        '', '', '', '', '', '', '', '',
        now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false,
        false
      )`
    )
    .join(",\n");

  const identityRows = Object.values(users)
    .map(
      user => `(
        ${sqlLiteral(user.id)},
        ${sqlLiteral(user.id)}::uuid,
        jsonb_build_object('sub', ${sqlLiteral(user.id)}, 'email', ${sqlLiteral(user.email)}, 'email_verified', true),
        'email',
        now(), now(),
        ${sqlLiteral(randomUUID())}::uuid
      )`
    )
    .join(",\n");

  const membershipsA = roles
    .map(
      role =>
        `(${sqlLiteral(orgAUsers[role])}::uuid, ${sqlLiteral(orgA)}::uuid, ${sqlLiteral(role)})`
    )
    .join(",\n");

  const setupSql = `
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, phone_change, phone_change_token,
      created_at, updated_at, raw_app_meta_data,
      raw_user_meta_data, is_sso_user, is_anonymous
    ) values
    ${userRows};

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      created_at, updated_at, id
    ) values
    ${identityRows};

    insert into public.organizations (id, name, slug, owner_user_id)
    values
      (${sqlLiteral(orgA)}::uuid, 'Phase 6 Tenant A', ${sqlLiteral(`phase6-a-${orgA}`)}, ${sqlLiteral(orgAUsers.owner)}::uuid),
      (${sqlLiteral(orgB)}::uuid, 'Phase 6 Tenant B', ${sqlLiteral(`phase6-b-${orgB}`)}, ${sqlLiteral(userB)}::uuid);

    insert into public.memberships (user_id, organization_id, role)
    values
      ${membershipsA},
      (${sqlLiteral(userB)}::uuid, ${sqlLiteral(orgB)}::uuid, 'owner');

    select 1 as setup_requested limit 1;
  `;

  return {
    projectRef: TARGET_PROJECT_REF,
    supabaseUrl: TARGET_URL,
    organizations: { tenantA: orgA, tenantB: orgB },
    users,
    roles,
    setupSql,
  };
}

export async function setup() {
  assertStagingTarget();
  const fixture = buildFixture();
  await writeFile(
    MANIFEST_PATH,
    JSON.stringify(
      {
        projectRef: fixture.projectRef,
        supabaseUrl: fixture.supabaseUrl,
        organizations: fixture.organizations,
        users: fixture.users,
        roles: fixture.roles,
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
  await writeFile(
    MCP_INPUT_PATH,
    JSON.stringify({ project_id: TARGET_PROJECT_REF, query: fixture.setupSql }, null, 2),
    { mode: 0o600 }
  );
}

export async function cleanup() {
  assertStagingTarget();
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (manifest.projectRef !== TARGET_PROJECT_REF) {
    throw new Error("Phase 6 cleanup refused: fixture project ref mismatch");
  }
  const userIds = Object.values(manifest.users).map(user => user.id);
  const organizationIds = Object.values(manifest.organizations);
  const idList = values => values.map(value => `${sqlLiteral(value)}::uuid`).join(", ");
  const cleanupSql = `
    delete from public.audit_log where organization_id in (${idList(organizationIds)});
    delete from public.memberships where organization_id in (${idList(organizationIds)});
    delete from public.organizations where id in (${idList(organizationIds)});
    delete from auth.users where id in (${idList(userIds)});
    select 1 as cleanup_requested limit 1;
  `;
  await writeFile(
    MCP_INPUT_PATH,
    JSON.stringify({ project_id: TARGET_PROJECT_REF, query: cleanupSql }, null, 2),
    { mode: 0o600 }
  );
}

export async function verifyCleanup() {
  assertStagingTarget();
  const verifySql = `
    select case when
      (select count(*) from auth.users where email like 'phase6-%') = 0
      and (select count(*) from public.organizations where slug like 'phase6-%') = 0
      and (select count(*) from public.memberships where organization_id in (select id from public.organizations where slug like 'phase6-%')) = 0
      and (select count(*) from public.audit_log where action like 'phase6_%') = 0
      then true else false end as cleanup_verified
    limit 1;
  `;
  await writeFile(
    MCP_INPUT_PATH,
    JSON.stringify({ project_id: TARGET_PROJECT_REF, query: verifySql }, null, 2),
    { mode: 0o600 }
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await mkdir("/tmp", { recursive: true });
  const command = process.argv[2];
  if (command === "setup") await setup();
  else if (command === "cleanup") await cleanup();
  else if (command === "verify") await verifyCleanup();
  else throw new Error("Usage: node scripts/phase6-staging-fixture.mjs <setup|cleanup|verify>");
}
