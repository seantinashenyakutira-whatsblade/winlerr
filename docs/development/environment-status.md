# Environment Status

> Bootstrap phase record — machine and toolchain state observed on 2026-10-08 (Windows 11, no git history modified).
> Update the Validation section whenever the gate commands are re-run.

## Machine prerequisites

| Requirement | Status | Notes |
|---|---|---|
| Node.js >= 20 | ✅ installed | `v24.21.0` (repo `engines`: `>=20.0.0`; CI uses 22) |
| npm | ✅ installed | `11.19.0` (repo pins `packageManager: npm@10.8.2` — same manager, minor version drift) |
| Git >= 2.40 | ✅ installed, ⚠️ not on PATH | `git version 2.55.0.windows.5` at `C:\Program Files\Git`; PATH entry missing |
| PowerShell execution policy | ⚠️ blocks npm shims | `npm.ps1`/`npx.ps1` blocked; use `cmd /c npm ...` or set policy `RemoteSigned` (CurrentUser) |
| pnpm / yarn | ➖ not installed | Not required — see repository-audit.md |
| Docker / WSL / Python / Java / PostgreSQL | ➖ not installed | No repository evidence requires them |

## Toolchain versions (from repository evidence)

| Tool | Version | Source |
|---|---|---|
| Node | >= 20 required; 24.21.0 installed; 22 in CI | `package.json engines`, `ci.yml` |
| Package manager | **npm 10.8.2** (canonical) | `packageManager` field + `package-lock.json` |
| Turbo | ^2.4.0 | devDependencies |
| Next.js | ^15.0.0 (App Router, `output: standalone`) | `apps/*/package.json`, `apps/web/next.config.ts` |
| React | ^19.0.0 | app package.jsons (`packages/ui` peers: 18 \|\| 19) |
| TypeScript | ^5.7.3 | devDependencies |
| ESLint | ^9.18.0 (flat config `eslint.config.mjs`) | devDependencies |
| Test framework | Vitest ^3.2.7 — **only `packages/ai` has tests** | `packages/ai/package.json` |
| Formatter | Prettier ^3.4.2 (`.prettierrc`, `.prettierignore`) | devDependencies |

## Validation (gate commands)

Run from repository root. Status: **PENDING** until the first full run of the bootstrap phase completes.

| Command | Result | Date |
|---|---|---|
| `npm ci` | ✅ SUCCESS — 297 packages (attempt 2 of retry loop; transient `ECONNRESET` on flaky network) | 2026-10-08 |
| `npm run lint` | ✅ 18/18 tasks successful (`next lint` deprecation warning + missing-Next-plugin warning, non-fatal) | 2026-10-08/09, re-verified on branch |
| `npm run typecheck` | ✅ 20/20 tasks successful — including forced (`--force`) re-run after the `tsconfig.base.json` path-mapping removal | 2026-10-09, re-verified on branch |
| `npm run test` | ✅ 24/24 tests passed (vitest, `packages/ai` — only workspace with tests) | 2026-10-09, re-verified on branch |
| `npm run build` | ✅ `next build` success — 21 routes (static + SSG + dynamic API) | 2026-10-09, re-verified on branch |
| `npm run dev` (local site check) | ✅ HTTP 200 on `localhost:3000`, Winlerr content served (first compile ~36s) | 2026-10-09 |

## Known environment issues

1. **Git not on PATH** — add `C:\Program Files\Git\cmd` to PATH (or reinstall with PATH option).
2. **PowerShell script policy** — `npm`/`npx` fail as `.ps1`; workarounds: `cmd /c npm …` or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
3. **Unstable network to registry.npmjs.org** — recurring `ECONNRESET` on large tarballs; mitigations used: `--maxsockets=4`, `NODE_OPTIONS=--dns-result-order=ipv4first`, `--no-audit`, retry loop (npm cache preserves progress between attempts).
4. **No `.env` file** — repo ships no `.env.example`; see local-development.md for the required variables.

## History of this phase

- Repo cloned successfully on 2026-10-08 after the GitHub account flag (multiple-accounts ToS issue) was lifted via support appeal.
- Pre-existing local `Winlerr` folder (a Windows theme pack, never pushed: `Winlerr-theme-backup` on Desktop) was moved aside, not deleted; real clone placed at `Desktop\Winlerr`.
- No git history modified; no lockfile created, deleted, or swapped; no package manager switched.

## Phase 0 record (2026-10-09, branch `fix/ci-npm-toolchain`)

- Machine: Git added to user PATH (`git --version` works in fresh PowerShell); execution policy set to `RemoteSigned` (CurrentUser) so `npm`/`npx` shims run. Local toolchain: Node v24.21.0, npm 11.19.0; CI baseline: Node 22, npm 10.8.2 (per repo contract).
- CI rewritten to npm; `@winlerr/config` dead tsconfig paths removed (forced typecheck 20/20); `.env.example` created (empty placeholders); `.gitignore` narrowed so `.env.example` is committable while real `.env` stays ignored; live docs (README, AGENTS.md, dev README) switched pnpm→npm.
- Deliberately NOT changed: `apps/web` `next lint` script (migrating to `eslint .` fails with 52 errors, mostly generated `.next/types/**` — needs its own fix, recorded as unresolved warning); historical pnpm-era docs (`docs/audit/*`, `docs/decisions/0001-monorepo.md`).
- Gates on the branch: lint 18/18 ✅, typecheck 20/20 forced ✅, test 24/24 ✅, build 21 routes ✅, workflow YAML parsed ✅.
