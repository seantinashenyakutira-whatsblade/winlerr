# Infrastructure Audit — Winlerr

- Audit date: 2026-10-10
- Auditor: OpenCode agent (workstation session) + owner-assisted interactive logins
- Repo HEAD at audit time: `origin/main` @ `5804a30` (PR #12 merge); work on `feature/winlaos-core` @ `84e5840`, clean tree
- Labels: **VERIFIED** (live command output) · **INFERRED** (strong evidence, not directly observed) · **UNVERIFIED** (not yet checked) · **BLOCKED** (cannot check with available access)

No credentials, tokens, secret values, customer data, or env dumps are recorded in this file.

## 1. Tools used (all VERIFIED via `--version`)

| Tool | Version | Source |
|---|---|---|
| Git | 2.55.0.windows.5 | pre-installed, added to user PATH (Phase 0) |
| gh | 2.102.0 | pre-installed, added to user PATH (this audit) |
| Node.js / npm | v24.21.0 / 11.19.0 | pre-installed (repo contract: Node ≥20, npm 10.8.2) |
| Vercel CLI | 63.1.2 | `npm i -g vercel` (this audit) |
| Supabase CLI | 2.120.0 | `npm i -g supabase` (this audit) |
| Wrangler | 4.149.0 | `npm i -g wrangler` (this audit) |
| Resend CLI | 2.23.0 (official `resend-cli`) | `npm i -g resend-cli` (this audit; official CLI confirmed at `resend/resend-cli`) |

## 2. Authentication status

| Service | Status | Identity / scope |
|---|---|---|
| GitHub (`gh`) | VERIFIED authenticated | `drizzlysean`, token scopes `gist, read:org, repo, workflow` — **READ on `winlerr`** (`viewerPermission: READ`). Git push/pull uses the owner credential in Git Credential Manager (verified working). |
| Vercel | VERIFIED authenticated | `seantinashenyakutira-2100`, scope `seantinashenyakutira-2100s-projects` (owner) |
| Supabase | VERIFIED authenticated (CLI login) | project list readable; **link BLOCKED** — `supabase link --project-ref uqdeuiaymoolyroppwhy` has not completed (no `supabase/config.toml` created after two attempts; likely DB-password rejection). No DB password was requested in chat or stored anywhere. |
| Cloudflare (wrangler) | VERIFIED authenticated | `zedideaarena@gmail.com`, account `Zedideaarena@gmail.com's Account` (`f35b6f280ae51e50e4425a2c980ae2dc`) |
| Resend | VERIFIED authenticated | profile `default` active |

## 3. GitHub audit (read-only; nothing merged or modified)

- VERIFIED: repo PUBLIC, default branch `main`, `origin/main` = `5804a30`.
- VERIFIED: **PR #12 merged with 3/3 checks green** — push-to-`main` run 1m2s, PR-branch run 1m23s (proves the Phase 0 npm CI fix works remotely). Older runs (#25–#30 era, ~7–11s) failed fast — consistent with the broken pnpm workflow diagnosis.
- VERIFIED: **no open PRs**. History: #8–#10 targeted `develop`, CLOSED unmerged; #11, #12 targeted `main`, MERGED.
- UNVERIFIED: branch protection on `main` — API returns 404 (means no rules, or hidden from a READ token). INFERRED minimal/none: PR #12 merged with zero reviews.
- INFERRED: `develop` branch does not exist on the remote (only `main` ever observed); PRs #8–#10 targeted a `develop` that is gone or never pushed.
- Commands: `gh repo view … --json viewerPermission`, `gh run list`, `gh pr list --state all`, `gh api …/branches/main/protection`.

## 4. Vercel audit (read-only; nothing changed, no deploys triggered)

- VERIFIED: project `winlerr` → production `https://www.winlerr.vip`; latest Production deployment **Ready** (~1h before audit, build 1m25s); latest Preview **Ready** (~54m). Deploys track git (main→Production, PRs→Preview). Preview capability VERIFIED.
- VERIFIED aliases on prod: `www.winlerr.vip`, `winlerr.vip`, `winlerr.vercel.app` (+ git-branch aliases).
- VERIFIED domains in scope: `winlerr.vip` (third-party registrar + nameservers, ~102d old), plus unrelated `pinkmanx.vip`, `zedideaarena.com`, `unifame.app`.
- VERIFIED env var **names** (values never displayed): Production + Preview both have `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`; `OPENROUTER_API_KEY` is a Secret on **Production only**.
- VERIFIED gaps: `RESEND_API_KEY` and `OWNER_EMAIL` are **absent in all environments** → claim confirmation/owner emails cannot send (code is best-effort, inserts still succeed). `SUPABASE_SERVICE_ROLE_KEY` absent (correct — code doesn't use it).
- UNVERIFIED via CLI: framework preset, root directory, build/install commands (dashboard-only).
- Housekeeping: `vercel link` created `.env.local` + `.vercel/` as a side effect — both **deleted** immediately without reading values; tree verified clean; `.env.local` confirmed git-ignored.
- Commands: `vercel whoami`, `vercel project ls`, `vercel ls winlerr`, `vercel inspect <prod-url>`, `vercel domains ls`, `vercel link`, `vercel env ls`.

## 5. Supabase audit (LINK RECOVERED 2026-10-10 — see below)

- VERIFIED via `supabase projects list`: **`Winlerr` (`uqdeuiaymoolyroppwhy`) matches the known reference** — ACTIVE_HEALTHY, eu-central-1, Postgres 17, org `oviwmrjvackukndbxiujt`, created 2026-06-26.
- VERIFIED: a **`Winlerr Staging` project (`xvwgumawzoqjduvtnlcs`) exists but is INACTIVE**, in a *different* org (`byngxjdnnivjmxdwncsm`), eu-west-1. All other visible projects INACTIVE.
- VERIFIED via `supabase migration list` (2026-10-10, Management API — no DB password needed):
  `20260925064611` (leads) applied 2026-09-25 ✅ · `20260926000000` (claims) applied 2026-09-26 ✅ ·
  `20261010000000` (admin_profiles) local-only, **not applied** ✅ (as designed).
- INFERRED (high confidence): live `leads`/`claims` tables + anon INSERT-only policies match tracked files — production forms insert successfully, which is only possible if those objects exist. `admin_profiles` absent (never in any applied migration).
- UNVERIFIED (live): column-level schema, indexes, grants, Auth providers/config, Edge Functions, storage buckets, extensions — `supabase db dump`/`pull` require Docker (not installed, correctly so); dashboard SQL editor queries provided to owner (see staging plan report).
- Link mechanics (diagnosed 2026-10-10): CLI v2 stores link state in git-ignored `supabase/.temp/linked-project.json`, **not** `supabase/config.toml` — the earlier "blocked" verdict was a wrong file expectation plus an interactive password prompt stalling in a non-TTY shell. `supabase link --project-ref` completes on the Management-API token alone; no DB password was entered, requested in chat, or stored.
- Commands used: `supabase projects list`, `supabase link`, `supabase migration list`. **Never run**: `db push`, `db reset`, `migration repair`, policy/data changes.

## 6. Cloudflare audit (PARTIAL)

- VERIFIED: `winlerr.vip` and `www.winlerr.vip` resolve to **Cloudflare edge IPv6** (traffic proxied through Cloudflare in front of Vercel). Combined with Vercel's "third-party nameservers": Cloudflare is the CDN front, not the authoritative DNS — INFERRED partial/CNAME setup.
- VERIFIED: **`os.winlerr.vip` does not exist** (NXDOMAIN) — future control-plane target, nothing to point yet.
- BLOCKED via CLI: Wrangler v4 removed `zones`/`dns` commands, and no workers-list command exists — proxy/SSL settings, zone config, and Workers inventory are **dashboard-only**.
- Nothing changed (no DNS edits, no Workers created).
- Commands: `wrangler whoami`, public `nslookup` for `winlerr.vip` / `www.winlerr.vip` / `os.winlerr.vip`.

## 7. Resend audit (read-only; no test email sent)

- VERIFIED: domain `winlerr.vip` (created 2026-10-09, eu-west-1): DKIM **verified**, SPF `rsend` **verified**, SPF `send` **pending** → status `partially_verified`; sending **enabled**, receiving disabled (correct), tracking off.
- VERIFIED: API request logs show **zero email sends** — only this audit's read calls. Claim-mail path is live in code but has never fired (consistent with missing `RESEND_API_KEY` in Vercel env).
- No API keys listed, no recipients touched.
- Commands: `resend auth list`, `resend domains list/get`, `resend logs list`.

## 8. Code ↔ cloud differences

| # | Difference | Label |
|---|---|---|
| 1 | Repo has no `vercel.json`; all Vercel config lives in dashboard | VERIFIED (both sides observed) |
| 2 | Repo `supabase/migrations/` = leads + claims (both confirmed applied live 2026-09-25/26) + unapplied admin_profiles; column-level live schema still needs dashboard SQL confirm | VERIFIED (history) / UNVERIFIED (columns) |
| 3 | Code reads `RESEND_API_KEY`/`OWNER_EMAIL`; Vercel env lacks both → mail path dead in prod | VERIFIED |
| 4 | Code reads `OPENROUTER_API_KEY`; present on Production only → Preview AI always falls back to canned replies | VERIFIED (acceptable by design, note it) |
| 5 | `os.winlerr.vip` referenced as future target; absent from DNS | VERIFIED |
| 6 | `Winlerr Staging` Supabase project exists but INACTIVE, different org/region than prod | VERIFIED (existence/state); purpose UNVERIFIED |
| 7 | `develop` branch strategy in docs vs `main`-only reality on remote | INFERRED |

## 9. Risks and operational notes

- **R1 — Unverified live schema.** The WinlaOS migration design (ADR 0002) is reviewed against tracked files, not the live DB. A drifted production schema would only surface at staging apply time. (Depends on: Supabase link.)
- **R2 — Silent mail failure.** Claim flow succeeds without sending any email; no alerting on the missing keys. Owner may believe confirmations go out.
- **R3 — No branch protection evidence.** `main` accepts direct pushes (all recent prod deploys are push-driven). One mistaken push = production change with no review gate.
- **R4 — Staging ambiguity.** An inactive staging project in another org suggests abandoned or planned staging; reactivating/using it needs an explicit decision (region + org differ from prod).
- **R5 — Auth context split.** Day-to-day CLI identity (`drizzlysean`, READ) differs from the push identity (owner via GCM). Confusion risk on whose permissions apply; collaborator invite would unify this.
- **R6 — Partial DNS visibility.** Cloudflare zone/proxy/SSL posture unverified; `os.winlerr.vip` rollout needs zone access decisions first.
- Non-issue confirmed: flaky npm registry needed retry flags but all installs completed; `pgsql-ast-parser` global install was a diagnostic dead end (cannot parse RLS DDL — fails identically on known-good production migrations) and will be removed.

## 10. Remediation, ordered by risk/dependency/value

1. ~~Complete `supabase link`~~ ✅ RESOLVED 2026-10-10 (link state in git-ignored `supabase/.temp/`; migration history verified live). Remaining: owner runs 3 read-only dashboard SQL checks (tables/policies/admin_profiles absence) — queries in mission report.
2. **Add `RESEND_API_KEY` + `OWNER_EMAIL` to Vercel Production** (and decide Preview) — requires explicit owner approval (production env change). Then send one real claim-flow test to an owner-controlled address.
3. **Finish Resend verification**: add the pending SPF `send` CNAME in DNS → full `verified` status.
4. **Unify GitHub write access**: owner invites `drizzlysean` as collaborator, or keep owner-login for pushes. Needed before the WinlaOS PR can be opened from the CLI identity.
5. **Confirm/establish `main` branch protection** (dashboard, owner): require PR + green CI, block force-pushes/deletions.
6. **Open the `feature/winlaos-core` PR** (push done) → Preview deploy → review. Do not merge until R1 is cleared.
7. **Decide the staging story**: reactivate `Winlerr Staging` vs create staging in the prod org/region; WinlaOS RLS tests must run against staging, never prod.
8. **Plan `os.winlerr.vip`**: requires DNS-zone access decision (Cloudflare partial vs registrar NS) + Vercel domain assignment. Design-only for now.
9. **Optional**: `OPENROUTER_API_KEY` on Preview (only if preview AI demos need live replies); remove `pgsql-ast-parser` global (cleanup).
