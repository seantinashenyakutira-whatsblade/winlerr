import type { Metadata } from "next";
import { DashboardShell } from "@/components/winlerros/dashboard-shell";

export const metadata: Metadata = { title: "WinlerrOS product preview", robots: { index: false, follow: false } };

export default function WinlerrOSPreviewPage() { return <DashboardShell preview/>; }
