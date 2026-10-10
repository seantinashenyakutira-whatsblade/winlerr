import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeNextPath } from "@winlerr/auth";
import { getViewer } from "@/lib/auth-actions";
import { AuthExperience } from "@/components/winlaos/auth-experience";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your WinlerrOS account to access your dashboard.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  const user = await getViewer();
  if (user) redirect(target);
  return (
    <Suspense>
      <AuthExperience mode="signup" form={<SignupForm next={target} />} />
    </Suspense>
  );
}
