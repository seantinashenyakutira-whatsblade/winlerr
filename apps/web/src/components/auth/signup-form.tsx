"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/lib/auth-actions";
import { AuthForm } from "@/components/auth/auth-form";

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [checkEmail, setCheckEmail] = useState<string | null>(null);
  if (checkEmail) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-sm" role="status">
        <p className="font-semibold">Check your email</p>
        <p className="mt-2 text-ink-muted">
          We sent a confirmation link to <span className="font-medium text-ink">{checkEmail}</span>.
          Open it to activate your account, then sign in.
        </p>
      </div>
    );
  }
  return (
    <AuthForm
      submitLabel="Create account"
      pendingLabel="Creating account…"
      next={next}
      onSubmit={async (values) => {
        const result = await signUpAction({ ...values, next });
        if (result.ok && !result.sessionActive) {
          setCheckEmail(values.email);
          return { ok: true as const };
        }
        return result;
      }}
      onSuccessNavigateTo={(target) => router.push(target)}
    />
  );
}
