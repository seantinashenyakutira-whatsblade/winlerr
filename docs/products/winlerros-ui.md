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
- `/dashboard` remains protected by the server-side `getViewer()` session guard and passes the authenticated email and sign-out action into the shell.
- `/dashboard/setup` is an interactive UI-only workspace setup preview; its state remains in memory and is not sent to a server.

## Integration boundary

Authentication is integrated through the existing auth actions, callback route, session cookies, and guarded dashboard. This UI work does not change those services. Organization creation, membership authorization, persistence, and workspace setup remain unimplemented; the setup flow explicitly identifies itself as a preview.

## Verification boundary

Static checks and browser layout review do not prove provider behavior, cookie security, callback validity, or workspace persistence. Validate those behaviors with the configured Supabase project and non-production accounts before release.
