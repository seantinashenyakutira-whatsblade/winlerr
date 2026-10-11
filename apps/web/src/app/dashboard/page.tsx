import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginUrl } from "@winlerr/auth";
import { getViewer, signOutAction } from "@/lib/auth-actions";
import { listOrganizationsAction } from "@/lib/workspace-actions";
import { DashboardShell } from "@/components/winlerros/dashboard-shell";

export const metadata: Metadata = {
  title: "WinlerrOS Dashboard",
  description: "Your WinlerrOS dashboard.",
  robots: { index: false, follow: false },
};

/**
 * Protected WinlerrOS shell: server guard (unauthenticated visitors
 * redirect to /login?next=/dashboard, no loops) + Codex's branded
 * DashboardShell fed only with organizations returned for this user by the
 * workspace action. A failed read is represented as unavailable, not empty.
 */
export default async function DashboardPage() {
  const user = await getViewer();
  if (!user) redirect(loginUrl("/dashboard"));
  let result: Awaited<ReturnType<typeof listOrganizationsAction>>;
  try {
    result = await listOrganizationsAction();
  } catch {
    result = { ok: false, error: "unknown" };
  }
  const organizations = result.ok ? result.data ?? null : null;
  return (
    <DashboardShell
      accountEmail={user.email}
      onSignOut={signOutAction}
      organizations={organizations}
      workspaceError={result.ok ? (result.data ? undefined : "unknown") : result.error}
    />
  );
}
