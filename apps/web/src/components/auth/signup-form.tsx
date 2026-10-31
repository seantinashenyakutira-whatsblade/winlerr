"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUrl } from "@winlerr/auth";
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
          If confirmation is required, check the inbox and spam folder for{" "}
          <span className="font-medium text-ink">{checkEmail}</span>. Open the confirmation link to
          continue, or return to sign in.
        </p>
        <a className="mt-4 inline-block underline" href={loginUrl(next)}>
          Back to sign in
        </a>
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
          return { ok: true as const, navigate: false as const };
        }
        return result;
      }}
      onSuccessNavigateTo={(target) => router.push(target)}
    />
  );
}
