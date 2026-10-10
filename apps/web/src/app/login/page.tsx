import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeNextPath } from "@winlerr/auth";
import { getViewer } from "@/lib/auth-actions";
import { AuthExperience } from "@/components/winlaos/auth-experience";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your WinlerrOS dashboard.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
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
      <AuthExperience mode="login" form={<LoginForm next={target} />} />
    </Suspense>
  );
}
