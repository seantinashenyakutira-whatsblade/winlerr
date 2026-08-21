# ADR 0001 — Monorepo Architecture

- **Status:** Established Decision
- **Date:** 2026-08-21
- **Deciders:** Winlerr Engineering
- **Related:** `docs/architecture/system-overview.md`, `AGENTS.md`

## Context

Winlerr will deliver multiple related products (CRM, booking, lead-response, client portal, WhatsApp agent) plus shared capabilities (auth, database, AI, integrations, notifications). The team needs to maximize code reuse, keep setup overhead low, and enable atomic cross-product changes without the operational cost of many repositories.

Alternatives are: (a) polyrepo (one repo per app/package), (b) monorepo (single repo for all code), (c) hybrid with git submodules.

## Decision

Winlerr will use a **monorepo** hosted at `seantinashenyakutira-whatsblade/winlerr`, managed with **pnpm workspaces** and **Turborepo**.

Structure:

```
winlerr/
├── apps/*           # per-product deployables
├── packages/*       # shared libraries (@winlerr/*)
├── services/*       # backend services
├── infrastructure/* # Supabase / Vercel / Cloudflare
├── docs/*           # architecture, ADRs, development, product docs
└── scripts/
```

Tooling at bootstrap: TypeScript, ESLint, Prettier, Turborepo pipelines (`build`, `dev`, `lint`, `typecheck`, `test`).

## Rationale

- **Reuse:** Shared packages (`@winlerr/ui`, `@winlerr/auth`, `@winlerr/database`, `@winlerr/ai`, etc.) are consumed via workspace links, eliminating duplication of auth, DB, and UI logic.
- **Atomic changes:** A single PR can update a shared package and all its consumers.
- **Onboarding & tooling:** One clone, one install (`pnpm install`), one CI. Consistent lint/typecheck/build conventions.
- **Strong typing:** Single `tsconfig` path aliases and strict checks across the repo.
- **Proportionate:** Avoids premature micro-repo or microservice overhead while remaining decomposable later — packages can be published or apps extracted if scale demands it.

## Consequences

- CI must be repo-aware (Turborepo remote cache optional, `--filter` per workspace).
- Versioning of shared packages is internal until published; breaking changes require coordination.
- Access control is repo-wide (branch protection on `main`/`develop`); finer-grained ownership via `CODEOWNERS` if needed later.
- Build graph must stay acyclic; `packages/*` must not depend on `apps/*` or `services/*`.

## Alternatives Considered

- **Polyrepo:** Rejected — higher coordination cost, duplicated tooling, slower cross-cutting changes at this stage.
- **Git submodules:** Rejected — complexity without the benefits of either approach.

## Follow-ups

- Evaluate Turborepo Remote Cache if build times grow.
- Add `CODEOWNERS` when team grows.
- Revisit if a package needs independent public versioning or a service needs a separate deployment lifecycle.
