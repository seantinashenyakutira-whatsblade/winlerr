# Winlerr — Supabase Audit

> Date: 2026-09-24. Branch: `fix/tooling`. Method: CLI read-only inspection only (`supabase --version`, `supabase projects list`, `supabase status`, filesystem checks). No link, no push, no schema writes. Secrets redacted (names only; no `.env` files exist on disk).

## Project overview

- CLI: `supabase 2.117.0`.
- `supabase projects list` exit 0. Four projects visible, all `linked: false`, none named winlerr (refs/hosts redacted):
  - `Unifame PWD WebApp` — eu-west-2 — INACTIVE
  - `Whatblade leads` — us-east-2 — INACTIVE
  - `Unifame Waitinglist` — eu-west-1 — INACTIVE
  - `Benson Anson WebApp` — eu-west-1 — ACTIVE_HEALTHY
- **Expected ref `uqdeuiaymoolyroppwhy` does NOT appear** in the list above. Link state: `linked_project: null`.
- No link was performed: linking requires the project to exist in the account and a database password that must not be guessed. Targeting a ref that is not visible would be unjustified.
- Local Supabase is unavailable: `supabase status` → `LegacyStatusDbInspectError … docker: command not found (podman also not found)`. No Docker on this machine, so `supabase start` / local inspection is impossible here.

## Schema inventory (public)

UNVERIFIED — no linked project and no local stack, so tables, views, functions, triggers, enums, and extensions cannot be listed. Local repo contributes zero migrations (`infrastructure/supabase/migrations/` holds only `.gitkeep`), and `infrastructure/supabase/config.toml` is a 5-line `[api]` placeholder, so there is nothing local to apply yet.

## Auth inventory

UNVERIFIED (same reason). User count PII-safe check not possible without a linked project. No auth code exists in the repo beyond placeholder comments.

## Storage inventory

UNVERIFIED — bucket names cannot be listed without a linked project.

## Edge function inventory

UNVERIFIED — function names cannot be listed without a linked project. None exist in the repo.

## Credential availability (names only)

- On disk: only `.env.example` (tracked). No `.env` / `.env.local` files exist (`Get-ChildItem -Filter .env*` = `.env.example` only; `git ls-files | grep .env` = `.env.example` only).
- `.env.example` (Phase 1 shape) documents: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). All values empty. No live credentials available to this audit.

## Conflict assessment

- From the repo side: **no conflict possible** — zero local migrations, zero tables, zero policies.
- From the remote side: **UNVERIFIED** — the target project is not visible, so empty / Winlerr-only / shared cannot be determined. If `uqdeuiaymoolyroppwhy` exists under a different account/org, using it blind would risk writing into an unknown database.

## Recommendation

1. Confirm the correct project ref (is `uqdeuiaymoolyroppwhy` created yet, and under which org?). If it should exist, re-run `supabase projects list` after access is granted.
2. Provide the database password through a secure channel (never chat/paste into docs); then run `supabase link --project-ref <confirmed-ref>` interactively.
3. Re-run this audit's read-only inspection (tables, RLS, auth counts, buckets, edge functions) once linked.
4. Do not author Winlerr migrations until the remote is confirmed empty-or-Winlerr-only.

## Open questions

1. Does `uqdeuiaymoolyroppwhy` exist, or must it be created (`supabase projects create` — needs explicit approval)?
2. Which org should own the Winlerr staging project?
3. Where will `SUPABASE_SERVICE_ROLE_KEY` live (Vercel env / secret manager)?
4. Is Docker Desktop expected on this machine for local Supabase, or is remote-staging the only DB target?
