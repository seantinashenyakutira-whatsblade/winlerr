import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthExperience } from "@/components/winlaos/auth-experience";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() { return <Suspense><AuthExperience mode="login"/></Suspense>; }
