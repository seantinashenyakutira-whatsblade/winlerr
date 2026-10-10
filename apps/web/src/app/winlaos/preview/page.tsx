import type { Metadata } from "next";
import { DashboardShell } from "@/components/winlaos/dashboard-shell";

export const metadata: Metadata = { title: "WinlaOS product preview", robots: { index: false, follow: false } };

export default function WinlaOsPreviewPage() { return <DashboardShell preview/>; }
