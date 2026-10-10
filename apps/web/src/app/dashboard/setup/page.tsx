import type { Metadata } from "next";
import { SetupPreview } from "@/components/winlaos/setup-preview";

export const metadata: Metadata = { title: "Workspace setup preview", robots: { index: false, follow: false } };

export default function WorkspaceSetupPage() { return <SetupPreview/>; }
