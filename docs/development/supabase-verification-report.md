# Supabase Verification Report — Schema Reconciliation & Security Remediation

- Date: 2026-10-10
- Branch: `fix/supabase-schema-reconciliation` (isolated worktree `Winlerr-reconcile`, from `origin/main` @ `024614d`; main checkout untouched)
- CLI: supabase 2.120.0, authenticated (Management API). No DB password entered, stored, or committed.
- Labels: **VERIFIED** (live output / closed-world repo evidence) · **OWNER-OBSERVED** (authorized prior inspection, not independently re-verified) · **INFERRED** · **UNVERIFIED** · **BLOCKED**

## 1. CLI access and linking outcome — VERIFIED

- `supabase --version` → 2.120.0. `supabase projects list` → both refs confirmed:
  prod `uqdeuiaymoolyroppwhy` (Winlerr, ACTIVE_HEALTHY, eu-central-1) and
  staging `xvwgumawzoqjduvtnlcs` (Winlerr Staging, INACTIVE, eu-west-1, other org).
- `supabase link --project-ref uqdeuiaymoolyroppwhy` succeeds on the login
  token alone (state in git-ignored `supabase/.temp/`; no `config.toml` in
  this CLI version — the earlier "blocked" verdict was a wrong file expectation).
- `supabase migration list` — VERIFIED ledger: `20260925064611` ✅ applied,
  `20260926000000` ✅ applied, `20261010000000` local-only, **not applied**.
- `supabase functions list` → **zero Edge Functions**. Storage `ls` → **zero buckets**.
- `supabase db dump` / `db pull` → BLOCKED (shell out to pg_dump in Docker;
  Docker is correctly not installed). No Docker installed for this task.

## 2. Actual remote schema vs tracked files

Source for the "Live (read-only checks 2026-10-10)" column: authorized
read-only queries Q1–Q9 (saved at `docs/development/supabase-live-checks.sql`).
No writes, no row contents read.

| Object | Tracked | Live (read-only checks 2026-10-10) |
|---|---|---|
| Public tables (Q1) | leads, claims (+6 proposed/expected, uncreated) | 8 tables, no extras: `admin_profiles`, `claims`, `failed_submissions`, `feature_suggestions`, `leads`, `newsletter_campaigns`, `prototype_requests`, `waitlist_leads` |
| `leads` / `claims` migrations | ✅ `20260925…` / `20260926…` | ✅ both applied (ledger) |
| `admin_profiles` migration | ✅ `20261010…` (proposal) | ❌ not applied |
| `admin_profiles` columns (Q2) | proposal: id, created_at, email, role | `id uuid NOT NULL` (PK → `auth.users(id)` ON DELETE CASCADE), `full_name text` nullable, `role text` nullable DEFAULT `'admin'`, `created_at timestamptz` nullable DEFAULT `now()` — **no `email` column** |
| RLS flags (Q3) | proposal: enable RLS | RLS **enabled, not forced** on `admin_profiles`, `leads`, `claims` |
| Policies (Q4) | proposal: owner-only | `admin_profiles`: SELECT `USING (true)` TO PUBLIC + INSERT EXISTS-check TO PUBLIC, both confirmed; `leads`/`claims`: anon INSERT confirmed; five dependent tables' predicates queried |
| Table grants (Q5) | n/a (code) | Broad grants reported for `anon`, `authenticated`, `service_role` on all three tables (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES) — recorded as a **privilege-review finding** (see S1). Grants alone do not demonstrate API exploitability: RLS policies and the exposed PostgREST surface gate actual access separately |
| Triggers on `admin_profiles` (Q6) | proposal: new trigger (unapplied) | **none** |
| `rls_auto_enable()` (Q7) | absent from repo (VERIFIED: zero matches in history or tree) | SECURITY DEFINER **event-trigger** function; enabled event trigger `ensure_rls` fires it on `ddl_command_end` for `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`; EXECUTE granted to PUBLIC, anon, authenticated, postgres, service_role |
| Constraints (Q8) | — | PK/FK/unique confirmed as tracked |
| Views / FKs / function refs (Q9) | — | **none** referencing `admin_profiles` |
| Request logs | n/a | Zero `admin_profiles` events in the queried 24h window — limited evidence; does not rule out historical or out-of-window access |
| Leaked-password protection | n/a (code) | UNVERIFIED (still needs dashboard Auth page check) |

## 3. Answers to the reconciliation questions

1. **What created the live table?** Out-of-band creation (dashboard SQL or
   equivalent). VERIFIED via closed-world git history: no tracked migration
   has ever contained `admin_profiles` (first appearance: `84e5840`).
2. **Does `IF NOT EXISTS` leave incompatible state?** YES. Against the
   observed table the CREATE is a no-op: no `email` column added, `role`
   default stays `'admin'`, `full_name` untouched.
3. **Would the proposal's policies restrict access?** NO. Permissive policies
   combine with OR — owner-only SELECT alongside `USING (true)`-to-public
   leaves public read (and public insert) fully intact. The proposal as
   written creates a false sense of restriction.
4. **TS role vs SQL?** RESOLVED and fixed: live verified as `full_name`
   (nullable), free-text `role` DEFAULT `'admin'`, no `email`, no check
   constraint. `types.ts` on this branch mirrors exactly that.
5. **Adopt or rename?** UNRESOLVED product decision — documented options in
   §6. Nothing in-repo consumes the table (VERIFIED: zero code references),
   but external dependents are unknown, so neither evolving nor replacing it
   can proceed on assumption.
6. **Safest path?** Guarded proposal + explicit drop-policy step gated on
   dependency proof + owner approval (see §6). No drops, no recreates, no
   data moves in this sprint.
7. **Local vs approved-ops?** Types/docs/tests/verify-script: local ✅ (this
   branch). Policy drops, trigger creation, function grant changes, auth
   toggles: separate approval each.

## 4. Security findings, ordered by severity

- **S1 — HIGH (credible public-read exposure; exploitation not
  demonstrated): permissive access on `admin_profiles`.** Read-only
  checks 2026-10-10 confirm: `anon` holds a SELECT table grant; the
  SELECT policy is `USING (true)` TO PUBLIC; an INSERT policy TO PUBLIC
  exists; RLS is enabled but not forced; no triggers exist on the table;
  the table holds **one row** (an earlier listing reported zero —
  discrepancy recorded, row content never read). What this means:
  (a) any unauthenticated caller can READ that row's columns — public read
  exposure is credible, not hypothetical;
  (b) anonymous callers CANNOT insert: the INSERT `WITH CHECK` is
  `EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())`, and
  `auth.uid()` is NULL for anon, so the predicate never holds — the
  earlier suggestion that arbitrary unauthenticated users could
  self-promote was wrong and is retracted;
  (c) the policy does NOT enforce `id = auth.uid()` on the inserted row —
  it only checks whether the caller ALREADY has a profile row. A user
  with no existing profile cannot bootstrap one through this policy
  (the earlier "insert exactly one self-row" claim is corrected).
  Owner-verified Auth settings (dashboard, 2026-10-10, unchanged by us):
  new-user signup ENABLED, email confirmation ENABLED, anonymous
  sign-ins DISABLED. Signup being enabled does NOT open a bootstrap
  path — a brand-new account has no profile row, so the EXISTS check
  fails for it. What remains is a narrower hypothesis: a caller who
  already holds a profile row may potentially insert a row for another
  existing Auth user, because the policy constrains neither the
  inserted row's ID nor the existing row's role — and the live `role`
  default is `'admin'`. Practical behavior and impact UNTESTED (never
  executed; the single existing row's owner is unknown, content never
  read). This stays a risk hypothesis until exercised against staging —
  no exploit demonstrated, none claimed;
  (d) the five dependent tables' RLS policies query
  `admin_profiles` with `id = auth.uid()` — live authorization decisions
  DO read this table today.
  Separate privilege-review finding (Q5): `anon`/`authenticated` hold
  broad table-level grants (including UPDATE/DELETE/TRUNCATE) on all
  three tables. These grants do NOT by themselves demonstrate a REST API
  exploit — with no UPDATE/DELETE policies on these tables, RLS still
  denies such operations through PostgREST — but they are excess
  privilege to tighten in the staged remediation (grants should mirror
  the policy surface). Staged, reviewed, never applied speculatively.
  Owner action required: confirm no external consumer beyond these
  policies, then approve least-privilege replacement (staging first).
- **S2 — MEDIUM: `rls_auto_enable()` SECURITY DEFINER executable by anon.**
  Read-only checks 2026-10-10 confirm it is an **event-trigger** function,
  invoked by the enabled event trigger `ensure_rls` on `ddl_command_end`
  for `CREATE TABLE`, `CREATE TABLE AS`, and `SELECT INTO`; EXECUTE is
  granted to PUBLIC, anon, authenticated, postgres, and service_role.
  Exploitability via anon looks low (anon cannot issue DDL, so the trigger
  never fires for them; a direct RPC call would run outside event context),
  but public EXECUTE on a definer function still violates least privilege.
  Do NOT revoke blindly — confirm no legitimate direct caller first
  (staged remediation), since breaking `ensure_rls` would silently leave
  future tables without RLS.
- **S3 — MEDIUM (hardening): leaked-password protection disabled**
  (last observed via dashboard; re-confirm on the Auth page in the same
  session as the policy fix). Dashboard toggle, no code impact.
- **S4 — PROCESS (fixed locally): the `20261010` proposal's false
  restriction.** Header rewritten with the OR-logic warning; assumption
  tests added. No prod effect (never applied).

## 5. Fixed locally (this branch) and how tested

- `packages/database/src/types.ts`: `admin_profiles` shape corrected to the
  observed live columns (`full_name`, free-text `role`), provenance comments,
  `Enums` cleared (no live enums). `AdminRole` union retained for future code.
- `supabase/migrations/20261010…`: header rewritten as superseded-pending-
  decision with the three consequences; SQL body unchanged (still unapplied).
- `packages/database/tests/migration-assumptions.test.ts` (new, 6 tests):
  idempotency markers, no data statements, RLS enable present, no anon/public
  grants, trigger wiring, do-not-apply header. Offline, green.
- `docs/development/supabase-live-checks.sql` (new): 8 read-only dashboard
  queries (tables, columns, RLS flags, policies, grants, triggers, function
  def, constraints). Inert location, never picked up by the CLI.
- `docs/decisions/0002-…md`: review-note amendment (status stays Proposed).
- Gates: lint 18/18, typecheck 20/20, vitest 38/38 (24 ai + 14 database),
  `next build` 21 routes — all on-branch green (full output in CI on PR).

## 6. Staging plan (no project created — decision required)

- **Recommended: fresh staging project in the prod org
  (`oviwmrjvackukndbxiujt`), region eu-central-1.** Same org = same access/
  billing control; same region = prod-like behavior for auth + RLS tests.
  Cost: covered by the existing org's plan tier — owner to confirm at
  creation (free-tier projects may auto-pause when idle; that is acceptable
  for a test target but must be known).
- **Alternative: reactivate `Winlerr Staging`.** Faster, but wrong org +
  wrong region bakes in permanent confusion; only if a same-day test bed is
  needed before the fresh project exists. Do not point WinlaOS tests at it
  long-term. Deletion of the orphan is a separate owner billing decision.
- **Staging verification plan** (runs after creation + migration apply
  approval): apply `20261010` proposal to staging; anon INSERT-into-leads ✅ /
  anon SELECT ❌; two verified test users A/B; A reads own profile ✅, B's ❌;
  A self-promotes → trigger rejects; service-role sync ✅; leads/claims anon
  INSERT preserved ✅. Rollback: migration is additive-only to staging; on
  failure, forward-repair (never prod). Never use production customer
  accounts as test users.
- **Not created/restored/activated in this task** — staging creation needs
  explicit approval (billing + permissions).

## 7. Blocked / needs owner action

1. Q1–Q9 read-only results INCORPORATED (§2) — remaining live-verification
   gap: Auth page re-confirmation (providers, leaked-password toggle) and
   any PostgREST log review beyond the 24h window.
2. External-consumer sweep COMPLETE (see §8) — owner to review the
   classification, especially the five dependent tables and the unknowns.
3. Approve staging option (fresh vs reactivate) + create it.
4. Decide adopt-vs-rename for the identity table (after 1–2).
5. Approve S2/S3 remediation (after function definition reviewed).

Exact next executable step: PR #15 (`fix/supabase-schema-reconciliation`,
draft) is open — required gates before any merge are owner review of §8,
green CI on the branch, and an explicit containment decision. CI passing
validates code correctness only; it says nothing about production database
security, which must be established through the dashboard evidence above.

## 8. External consumer investigation (2026-10-10)

Question: does anything outside the Winlerr repo read/write production
`admin_profiles` (or depend on its permissive public policies)?

### Sources checked

- **GitHub code search (exact ref `uqdeuiaymoolyroppwhy`, VERIFIED):** matches
  only winlerr docs + two private backup repos (`VPS-CREDITDENTIALS` →
  `WINLERR-RECOVERY-MANIFEST.md`, `dev-env-snapshot` → `RESTORE.md`).
  Contents NOT fetched (expected secrets adjacent) — recorded as
  documentation mentions, not consumers.
- **GitHub code search (`admin_profiles`, VERIFIED):** exactly one external
  hit — `pinkman-X` (`src/lib/AuthContext.tsx` queries
  `admin_profiles.select('id').eq('id', own_id)` for an `isAdmin` flag; plus
  its own `supabase/admin_portal.sql` table design). This file is the likely
  template the Winlerr table was adapted from (shared `full_name` shape).
- **pinkman-X deployed bundle (`www.pinkmanx.vip` JS, VERIFIED):** does NOT
  contain the Winlerr prod ref (one other Supabase host present, identity
  deliberately not recorded). pinkman-X points at its own backend —
  **not a consumer of Winlerr prod.**
- **whatsblade-leads deployed JS (VERIFIED):** no Winlerr prod ref.
  tonyckleads homepage (VERIFIED): no ref in served HTML (stub page).
  Remaining Vercel projects: bundles not exhaustively scraped — see limits.
- **Vercel env inspection:** CLI `env ls` shows names + ciphertext only;
  `env pull` (the only decrypt path) is forbidden by task rules, so
  per-project URL comparison via CLI is BLOCKED. Server-side-only usage
  would not appear in public bundles regardless.
- **DB-internal dependents (VERIFIED via read-only checks 2026-10-10):**
  RLS policies on five additional live tables reference `admin_profiles`
  with `id = auth.uid()`:
  `failed_submissions`, `feature_suggestions`, `newsletter_campaigns`,
  `prototype_requests`, `waitlist_leads`. None of these tables exist in
  tracked migrations — the live DB is substantially larger than the repo
  represents. Dependency queries confirmed: no views, no foreign keys,
  and no ordinary function source referencing the table beyond the
  `rls_auto_enable()` event-trigger helper.
- **Logs (read-only checks 2026-10-10):** a PostgREST log query matched
  zero `admin_profiles` events in the queried 24h window. Limited
  evidence only — does not rule out historical access or requests outside
  that search. CLI has no logs surface; deeper review needs an owner
  dashboard session.

### Classification

- **CONFIRMED INTERNAL DEPENDENCIES:** RLS policies on five live tables
  (`failed_submissions`, `feature_suggestions`, `newsletter_campaigns`,
  `prototype_requests`, `waitlist_leads`) query `admin_profiles` with
  `id = auth.uid()` (owner-verified pattern). These are LIVE authorization
  decisions reading the table — the earlier "no active consumer" statement
  is retracted. They MUST be preserved: dropping or tightening
  `admin_profiles` access without accounting for them risks breaking those
  tables' policies. Dependency absence beyond these five is VERIFIED
  (Q9a/b/c: no views, no FKs, no function-source matches) — the five
  policy dependencies stand as the complete known list.
- **CONFIRMED FACTS (owner-verified, content never read):** the table holds
  one row (an earlier listing reported zero — discrepancy recorded, cause
  unknown: later insert, transient read, or listing error; no conclusion
  drawn); `anon` has a SELECT grant; SELECT policy `USING (true)` TO PUBLIC.
- **EXTERNAL CONSUMERS:** no external consumer was found in the sources
  examined. pinkman-X (the sole code hit) queries its own backend, not
  Winlerr prod. This is a scoped negative finding, not a clean bill of
  health: server-side-only consumers and the unknowns below remain
  unresolved, so absence of evidence here must not be read as evidence of
  absence.
- **EXTERNAL CONSUMERS NOT FOUND IN SOURCES CHECKED:** GitHub exact-ref
  search, accessible repo code search, three deployed bundles checked.
- **STILL UNKNOWN:** (a) server-side-only consumers (invisible to bundle
  inspection; Vercel env values unreadable without `env pull`), (b) traffic
  older than the queried 24h log window, (c) contents/roles of the two
  private backup repos (deliberately unopened), (d) who owns the single
  existing profile row (content never read). Auth signup posture is
  RESOLVED (dashboard 2026-10-10: signup on, email confirm on, anon
  sign-ins off) — it narrows but does not close the S1(c) hypothesis,
  which still awaits a staging test.

### Justified direction

The findings support **adoption over renaming, but NOT on the current
proposal**: the table is load-bearing for five live tables' policies, so a
separate identity table would leave the permissive policies — and the S1
exposure — in place while adding a second source of truth. The safe path is:
keep the table and every existing policy untouched until Q4/Q9 + consumer
confirmation land, then replace the permissive policies explicitly with
least-privilege equivalents in one reviewed migration (staging first).
Containment posture: public READ exposure is credible (one row, world-
readable grant + policy); exploitation has NOT been demonstrated — no
evidence of unauthorized reads beyond the policies' existence, and the
remaining insert path requires a caller that already holds a profile row
(a capability never exercised by us, and the existing row's owner is
unknown). No emergency action is claimed; the decision on containment
timing sits with the owner. PR #14 (prior reconciliation) has merged; this
report now gates PR #15, which must stay unmerged until owner review,
green CI, and an explicit containment decision are all recorded.
