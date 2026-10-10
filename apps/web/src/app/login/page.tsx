import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthExperience } from "@/components/winlerros/auth-experience";

export const metadata: Metadata = { title: "WinlerrOS sign in", robots: { index: false, follow: false } };

export default function LoginPage() { return <Suspense><AuthExperience mode="login"/></Suspense>; }
