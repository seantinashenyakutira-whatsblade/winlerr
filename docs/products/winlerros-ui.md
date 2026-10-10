# WinlerrOS UI direction

## Brand and interface system

WinlerrOS uses the official Winlerr palette: deep navy `#111827` for the existing `W/` mark, wordmark, text, navigation and strong structure; royal blue `#2563EB` for primary actions, links, selected controls and focus; selective orange `#F97316` for secondary emphasis; off-white `#F8FAFC` for page backgrounds; and white cards with subtle neutral borders. Shared CSS variables in `apps/web/src/app/globals.css` define the palette, derived blue/orange/neutral tints, borders, radii and shadows. Product controls and Tailwind theme colors consume these tokens.

The existing W/ mark and lowercase Winlerr wordmark are shared through `WinlerrLogo`, including the WinlerrOS product suffix. Typography remains Inter for product text, Inter Tight for display headings and JetBrains Mono for small labels. Spacing follows a 4px rhythm, with 12–24px card radii and quiet borders. Keyboard focus uses a visible blue outline; reduced-motion preferences are respected. Dashboard density collapses to touch-friendly navigation and stacked content on smaller screens.

The public Winlerr site at `https://www.winlerr.vip` uses the same W/ and Winlerr identity and presents mobile-first business systems. WinlerrOS retains that identity while providing a denser workspace interface.

## Routes

- `/winlerros` introduces WinlerrOS before signup.
- `/winlerros/onboarding` explains the account and workspace setup sequence.
- `/signup` and `/login` provide the auth shells and query-addressable message presentations; controls remain disabled until the real auth integration is available.
- `/winlerros/preview` shows the responsive dashboard with empty-state content explicitly labelled as preview.
- `/dashboard` is locked until the backend route provides its server-side session check.
- `/dashboard/setup` is an interactive UI-only workspace setup preview; values remain in memory and are not sent to a server.
- `/winlaos` and its subpaths permanently redirect to their `/winlerros` equivalents for compatibility.

## Backend integration boundary

Authentication actions, sessions, workspace creation, organization identity, membership, persistence and authorization remain backend dependencies. This UI work does not import or copy auth/session code and does not claim successful signup. When the real integration is available, connect the disabled auth controls to its supported actions and retain a server-side session guard on `/dashboard`.

## Verification boundary

The preview contains no real user or organization data and performs no auth or persistence calls. Static checks and browser QA can verify layout and client-only interaction, not backend auth, session security or workspace persistence.
