# MVP launch slice

**Status:** implemented on `feature/mvp-launch` as a review candidate. This document describes the launch surface built on top of the Phase 6 foundation; it does not authorize a merge or production deployment.

## Established in this slice

The `apps/web` Next.js application now contains the public Winlerr website, five-product catalogue, request handoff, client-login boundary, WinlaOS portal shell, and Lead Response demonstration. The design uses a responsive deep-green, cream, and amber visual system with accessible forms, empty states, and status messaging.

The shared `@winlerr/core` package defines product keys, product availability, product-instance contracts, product requests, leads, lead events, and lead responses. It is a contract package only at this stage; it does not create database tables or bypass the existing organization and membership authorization chain.

## Truthful boundaries

Public production authentication is not enabled by the launch UI. `/login` explains that staging authentication is verified while production environment and domain approval remain outstanding. `/portal` is a preview shell with explicit empty states, not a claim that product persistence is live.

The `/request` form prepares an email handoff to `hello@winlerr.vip`. It does not claim to persist an order, send notification, or create a customer account. The `/lead-response` route uses local demo data; marking a reply sent changes only local state and explicitly says no external message was delivered.

AI provider calls, WhatsApp/social delivery, booking/calendar actions, billing, production Supabase, and the production domain remain deferred until credentials, provider access, environment separation, RLS migrations, and owner approval are available.

## Verification

The public app has been browser-smoke-tested at `/`, `/portal`, and `/lead-response`. The Core package has passing lint, strict typecheck, and unit tests. The web package has passing focused lint, typecheck, and production build. Next.js reports only non-blocking CSS/autoprefixer and plugin-detection warnings.
