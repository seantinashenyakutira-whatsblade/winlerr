"use client";

/**
 * AuthForm — shared email/password form shell (backend slice).
 * Codex owns visual design: keep the onSubmit contract
 * (values → Promise<{ ok, errorMessage? }>) and these element ids stable.
 */
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AuthFormProps {
  submitLabel: string;
  pendingLabel: string;
  next: string;
  onSubmit: (values: { email: string; password: string }) => Promise<{
    ok: boolean;
    errorMessage?: string;
  }>;
  onSuccessNavigateTo: (next: string) => void;
  extraBelowForm?: React.ReactNode;
}

export function AuthForm({
  submitLabel,
  pendingLabel,
  next,
  onSubmit,
  onSuccessNavigateTo,
  extraBelowForm,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await onSubmit({ email: email.trim(), password });
      if (result.ok) {
        onSuccessNavigateTo(next);
      } else {
        setError(result.errorMessage ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not reach the authentication service. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-describedby={error ? "auth-form-error" : undefined}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            placeholder="you@business.co.zm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            placeholder="At least 8 characters"
          />
        </div>
        {error ? (
          <p id="auth-form-error" role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {extraBelowForm}
      </div>
    </form>
  );
}
