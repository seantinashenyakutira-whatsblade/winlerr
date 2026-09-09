# web — Winlerr public launch surface

This Next.js application is the public Winlerr launch surface and the initial client-facing shell. It is intentionally consolidated on one app while product validation is still in progress.

## Routes

- `/` is the public website and five-product catalogue.
- `/request` captures a system enquiry and prepares a structured email handoff to `hello@winlerr.vip`.
- `/login` explains the controlled authentication boundary and links to the preview workspace.
- `/portal` is the WinlaOS client shell with organization context, product visibility, and truthful empty states.
- `/lead-response` is the deepest MVP demonstration: a local lead queue, selected-lead response draft, and local status transition.

## Boundary

The staging Supabase authentication and RLS foundation is established in `@winlerr/database` and `@winlerr/auth`, but production public authentication, product persistence, billing, external channel delivery, and AI provider calls are not enabled by this app yet. The portal and Lead Response demo state those boundaries in the UI instead of fabricating live behavior.

The request form is intentionally a mailto handoff until an approved production notification and product-request persistence path is configured. The Lead Response demo uses local data and never claims to send an external message.

## Deployment

The linked Vercel project uses `apps/web` as its monorepo root. The current Vercel production branch is intentionally still `main`; the MVP launch branch is review-only until its PR dependencies and owner approval are complete.

## Commands

```bash
pnpm --filter web dev
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
```
