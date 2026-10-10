import { safeNextPath } from "@winlerr/auth";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth-actions";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your WinlaOS dashboard.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getViewer();
  if (user) redirect(safeNextPath(next));
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">WinlaOS</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Access your dashboard. New here?{" "}
        <a className="underline" href="/signup">
          Create an account
        </a>
        .
      </p>
      <div className="mt-8">
        <LoginForm next={safeNextPath(next)} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        <a className="underline" href="/get-started">
          Back to Get started
        </a>
      </p>
    </main>
  );
}
