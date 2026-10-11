"use client";

/**
 * /auth/callback — completes email confirmation + OAuth-style handoffs.
 * Handles BOTH link shapes without losing `next`:
 *  - ?code=… (PKCE): exchanged server-side via exchangeCodeAction.
 *  - #access_token=…&refresh_token=… (implicit): read client-side (URL
 *    fragments never reach the server) and bridged via POST /api/auth/session.
 */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@winlerr/auth";
import { exchangeCodeAction } from "@/lib/auth-actions";

function parseHashTokens(hash: string): { access_token: string; refresh_token: string } | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const access_token = params.get("access_token") ?? "";
  const refresh_token = params.get("refresh_token") ?? "";
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

function CallbackRunner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      const next = safeNextPath(searchParams.get("next"));
      try {
        const code = searchParams.get("code");
        if (code) {
          const result = await exchangeCodeAction(code);
          if (!cancelled) {
            if (result.ok) router.replace(next);
            else setError(result.errorMessage ?? "Confirmation failed. Request a new link and try again.");
          }
          return;
        }
        const tokens = parseHashTokens(window.location.hash);
        if (!tokens) {
          if (!cancelled) setError("This confirmation link is invalid or expired. Request a new one and try again.");
          return;
        }
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(tokens),
        });
        if (!cancelled) {
          if (response.ok) router.replace(next);
          else setError("Could not complete sign-in. Request a new link and try again.");
        }
      } catch {
        if (!cancelled) setError("Could not reach the authentication service. Check your connection and retry.");
      }
    }
    void finish();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
        <a className="mt-4 text-sm underline" href="/login">
          Back to sign in
        </a>
      </main>
    );
  }
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <p role="status" className="text-sm text-ink-muted">
        Confirming your email…
      </p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 py-16 text-sm text-ink-muted">Confirming…</main>}>
      <CallbackRunner />
    </Suspense>
  );
}
