# Subdomain Architecture

**Status:** Proposed
**Scope:** `apps/web` routing model, customer-facing hostnames, and the boundary between the marketing site and per-tenant application hosts.

## Context

Winlerr serves two different things from one product:

1. The **marketing and documentation site** — the landing page, `/systems`, `/docs`, `/about`, `/get-started`, and lead capture. Public, indexable, unauthenticated.
2. The **per-customer application** — each business's own dashboard and enquiry inbox, holding that customer's leads and conversations. Private, tenant-scoped, authenticated.

These have opposite security and caching requirements. The marketing site is public and cacheable at the edge. Customer data is private, must never be served from a shared cache, and must be isolated per tenant. Mixing them on one hostname is the common failure mode we want to design against.

## Decision

Use **path-based routing for the marketing site** and **subdomain-per-tenant for the application**.

| Surface | Hostname | Routing | Data |
| --- | --- | --- | --- |
| Marketing site | `winlerr.vip` | Path (`/systems`, `/docs`, ...) | None |
| Tenant application | `<tenant>.winlerr.vip` | Root path | Tenant-scoped |
| Customer website preview | `<slug>.winlerr.app` | Path | Static, published |

Three properties follow from the subdomain model, and they are the reason for the decision:

- **Isolation is visible in the URL.** A support conversation that starts with "check their dashboard" ends with a single hostname to read out. A leaked link cannot silently point at another tenant's data, because the host is part of the identifier.
- **Cookies scope naturally.** A session cookie set on `*.winlerr.vip` is shared by design; a tenant session is scoped to the exact host, so the marketing site and the application never share a session.
- **Free-website hosting stays separate.** Customer sites live under `winlerr.app`, not `winlerr.vip`, so a customer site can never be mistaken for, or rank against, our own marketing pages.

## Cross-cutting rules

These apply to every host and are not optional per-surface.

1. **Tenant resolution happens once, at the edge.** The subdomain is resolved to a tenant ID by middleware before any data access. Handlers never re-parse the hostname to make authorisation decisions.
2. **Tenant ID is server-derived, never client-supplied.** The tenant comes from the resolved host. A tenant ID arriving in a request body, query parameter, or header is untrusted input and must be ignored or rejected.
3. **Every query is scoped by tenant.** Row Level Security in Postgres is the enforcement point, per `AGENTS.md` §3. Application-level `WHERE tenant_id = ...` is defence in depth, not the primary control.
4. **No caching of tenant responses.** Marketing responses are edge-cacheable; tenant responses are `private, no-store`. A shared cache keyed only on path is a cross-tenant data leak.
5. **Authentication is required on every tenant host**, including the root path. No route on a tenant subdomain is implicitly public.
6. **Unverified tenants get an explicit state.** A newly created or unclaimed tenant renders a claim page. It must not 404, and it must not serve another tenant's data.

## Marketing site (current implementation)

`apps/web` is the marketing site and is the only app deployed today. It owns:

- `/` — landing page
- `/systems` — the six systems
- `/docs` and `/docs/[slug]` — documentation articles
- `/about`
- `/get-started` — lead capture form, posting to `/api/leads`
- `/api/leads` — public, unauthenticated, rate limited, input validated

Because this app is public and unauthenticated, it must never hold a database connection capable of reading tenant data. Lead capture writes through the anon-key path under RLS, and no tenant read path exists in this app at all.

## Tenant application (not yet built)

The tenant application is a separate app on its own host, not a route branch in `apps/web`. When it is built:

- Middleware resolves the subdomain to a tenant ID and rejects unknown hosts with a 404.
- Unauthenticated requests are redirected to sign-in on that same host.
- The marketing site's lead form gains a post-signup flow that provisions the tenant and hands back the assigned hostname.

Provisioning, hostname assignment, and claim flows are out of scope for this document and should be specified when the tenant application is scheduled.

## Consequences

**Accepted costs**

- Wildcard TLS and DNS for `*.winlerr.vip` must be configured before the first tenant exists; this is infrastructure work with a lead time, not a code change.
- Absolute URLs in tenant-facing emails must use the tenant hostname, so any hardcoded `winlerr.vip` link is a bug in tenant context.
- Local development needs a hosts-file or DNS wildcard entry to exercise tenant subdomains; `localhost` cannot represent them faithfully.

**Rejected alternatives**

- **One hostname, tenant in the path** (`/app/<tenant>/...`). Rejected: tenant identity becomes a URL parameter that is trivially editable, and it forces the marketing site's cache policy to be the strictest possible for the whole domain.
- **Subdomain for everything including marketing** (`www.winlerr.vip`, `<tenant>.winlerr.vip`). Rejected: the marketing site would then inherit the no-store, authenticated policy that tenant hosts require.
- **Subdomain per customer website under the marketing domain** (`<slug>.winlerr.vip`). Rejected: customer pages would share the root domain's trust and SEO profile with our own marketing content.

## Open questions

- Should a tenant keep a vanity domain, or is the `*.winlerr.vip` hostname the only supported form for v1?
- Do we need per-tenant rate limiting at the edge, or is application-level limiting sufficient for the expected tenant count?
- Is `<slug>.winlerr.app` the right published domain for free websites, or should that be a separate registrable domain?
