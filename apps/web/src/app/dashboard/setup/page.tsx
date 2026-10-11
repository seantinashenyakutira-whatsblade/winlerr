import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginUrl } from "@winlerr/auth";
import { WorkspaceSetupForm } from "@/components/winlerros/workspace-setup-form";
import { getViewer } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Create a WinlerrOS Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WorkspaceSetupPage() {
  const user = await getViewer();
  if (!user) redirect(loginUrl("/dashboard/setup"));
  return <WorkspaceSetupForm />;
}
