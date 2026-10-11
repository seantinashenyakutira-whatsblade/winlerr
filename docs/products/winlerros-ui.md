# WinlerrOS product UI

## Brand system

The product UI uses Winlerr's official palette: Deep Navy `#111827` for structure and text, Royal Blue `#2563EB` for links and interactive states, Orange `#F97316` for selective emphasis, and Off White `#F8FAFC` for page surfaces. White cards, neutral slate borders, visible blue keyboard focus, responsive layouts, and reduced-motion support establish hierarchy. The existing W/ mark and Winlerr wordmark are reused; no generated logo asset is shipped.

The product UI is denser than the marketing site while retaining its crisp typography, restrained borders, and clear navigation. Components are code-native and use Lucide icons.

## Routes

- `/winlerros` introduces the product.
- `/winlerros/onboarding` explains the account and workspace setup sequence.
- `/winlerros/preview` shows the responsive dashboard shell with preview-only empty-state content.
- `/winlaos`, `/winlaos/onboarding`, and `/winlaos/preview` permanently redirect to their `/winlerros` equivalents.
- `/signup` and `/login` use the real signup and sign-in forms, with email confirmation and callback behavior supplied by the auth integration.
- `/dashboard` remains protected by the server-side `getViewer()` session guard. It displays only organizations returned by `listOrganizationsAction`; a successful empty list and a failed/unavailable read have separate states. Customer, sales, and activity metrics are not represented as live data.
- `/dashboard/setup` is protected by the same session guard and creates an organization through `createOrganizationAction({ name, slug })`. The shared workspace schemas validate both fields. Duplicate addresses, validation errors, unauthenticated requests, and backend failures are shown as errors; success navigation happens only after an organization is returned.

## Integration boundary

Authentication remains integrated through the existing auth actions, callback route, session cookies, and guarded dashboard. This UI work does not change those services. Workspace actions use the authenticated session and the `@winlerr/workspace` contract. The organization migration remains a proposal until deployed, so database availability must be confirmed before relying on workspace creation in an environment.

## Verification boundary

Static checks and browser layout review do not prove provider behavior, cookie security, callback validity, or workspace persistence. Use injected action tests for onboarding outcomes. Validate provider behavior with a non-production Supabase project before release; do not test workspace writes against production.
