import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthExperience } from "@/components/winlaos/auth-experience";

export const metadata: Metadata = { title: "Create your account", robots: { index: false, follow: false } };

export default function SignupPage() { return <Suspense><AuthExperience mode="signup"/></Suspense>; }
