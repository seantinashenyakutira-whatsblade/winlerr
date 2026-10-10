import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginUrl } from "@winlerr/auth";
import { getViewer, signOutAction } from "@/lib/auth-actions";
import { DashboardShell } from "@/components/winlaos/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your WinlerrOS dashboard.",
  robots: { index: false, follow: false },
};

/**
 * Protected WinlerrOS shell: server guard (unauthenticated visitors
 * redirect to /login?next=/dashboard, no loops) + Codex's branded
 * DashboardShell fed with the live session account. Workspace setup stays
 * UI-only until the organization persistence contract exists.
 */
export default async function DashboardPage() {
  const user = await getViewer();
  if (!user) redirect(loginUrl("/dashboard"));
  return <DashboardShell accountEmail={user.email} onSignOut={signOutAction} />;
}
