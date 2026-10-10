import type { Metadata } from "next";
import { SetupPreview } from "@/components/winlerros/setup-preview";

export const metadata: Metadata = { title: "WinlerrOS workspace setup preview", robots: { index: false, follow: false } };

export default function WorkspaceSetupPage() { return <SetupPreview/>; }
