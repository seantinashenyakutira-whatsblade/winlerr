# WinlaOS UI direction

## Design system

The product experience uses a warm, editorial workspace: paper `#faf9f5`, forest `#173b32`, muted sage surfaces, and copper `#a65435` for emphasis. Inter remains the product sans; Inter Tight is used for display headings and JetBrains Mono for small uppercase labels. Spacing follows a 4px rhythm, with 12–24px card radii, quiet 1px borders, and soft low-elevation shadows. Lucide icons share a 16–20px stroke scale. Focus uses a visible copper outline; reduced-motion preferences are respected.

Two visual directions were explored in a generated side-by-side concept board: the selected warm paper/forest direction and a cooler white/slate/blue direction. The board was exploratory only; no generated raster asset is used in the application. Product layouts use code-native interface elements and icons.

## Routes

- `/winlaos` introduces the product before signup.
- `/winlaos/onboarding` explains the account and workspace setup sequence.
- `/signup` and `/login` provide the visual auth shells and query-addressable confirmation/expired/error/success presentations.
- `/winlaos/preview` shows the responsive dashboard shell with empty-state content explicitly labelled as preview.
- `/dashboard` is locked until the backend branch's server-side session check is integrated.
- `/dashboard/setup` is an interactive UI-only workspace setup preview; its state remains in memory and is not sent to a server.

## Backend integration boundary

The local `feature/winlaos-auth-core` worktree documents the intended `/login`, `/signup`, `/auth/callback`, `/api/auth/session`, and `/dashboard` contract. That branch has uncommitted files and no remote branch ref at implementation time. This UI branch therefore does not import unavailable actions, copy auth/session code, or claim successful signup. Before release, merge the backend contract and replace the disabled auth controls with its `LoginForm`/`SignupForm` actions while retaining the screen layout; the backend `/dashboard` route must retain its server-side `getViewer()` guard. Workspace creation, organization identity, membership, persistence, and authorization are intentionally not implemented here pending an approved data contract and policy layer.

## Verification boundary

The preview contains no real user or organization data and performs no auth or persistence calls. Browser QA can verify layout and client-only interaction, not backend auth, session security, or workspace persistence.
