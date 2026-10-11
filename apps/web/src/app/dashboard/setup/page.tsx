import type { Metadata } from "next";
import { SetupPreview } from "@/components/winlerros/setup-preview";

export const metadata: Metadata = { title: "WinlerrOS Workspace Setup Preview", robots: { index: false, follow: false } };

export default function WorkspaceSetupPage() { return <SetupPreview/>; }
