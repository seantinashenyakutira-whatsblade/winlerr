import { redirect } from "next/navigation";
import { loginUrl } from "@winlerr/auth";
import { getViewer, signOutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Dashboard",
  description: "Your WinlaOS dashboard.",
  robots: { index: false, follow: false },
};

/**
 * Protected WinlaOS shell (backend slice). Server-guarded: unauthenticated
 * visitors redirect to /login?next=/dashboard with no loop (login bounces
 * authenticated users away). Codex owns the visual design — keep the
 * data contract (user.email, sign-out form action) stable.
 */
export default async function DashboardPage() {
  const user = await getViewer();
  if (!user) redirect(loginUrl("/dashboard"));
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">WinlaOS dashboard</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Welcome back</h1>
      <Card className="mt-8">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Signed in as</dt>
            <dd className="font-medium" data-testid="dashboard-user-email">
              {user.email ?? "Account"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">User ID</dt>
            <dd className="font-mono text-xs" data-testid="dashboard-user-id">
              {user.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Email confirmed</dt>
            <dd>{user.emailConfirmed ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-sm text-ink-muted">
        Your systems and onboarding live here next. Role and organization
        access unlocks with the WinlaOS identity rollout.
      </p>
    </main>
  );
}
