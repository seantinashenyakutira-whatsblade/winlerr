"use client";

import { useRouter } from "next/navigation";
import { signInAction } from "@/lib/auth-actions";
import { AuthForm } from "@/components/auth/auth-form";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  return (
    <AuthForm
      submitLabel="Sign in"
      pendingLabel="Signing in…"
      next={next}
      onSubmit={async (values) => signInAction(values)}
      onSuccessNavigateTo={(target) => router.push(target)}
    />
  );
}
