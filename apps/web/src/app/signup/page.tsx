import { safeNextPath } from "@winlerr/auth";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth-actions";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create account",
  description: "Create your WinlaOS account to access your dashboard.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
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
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        One account for your dashboard and systems. Already have one?{" "}
        <a className="underline" href="/login">
          Sign in
        </a>
        .
      </p>
      <div className="mt-8">
        <SignupForm next={safeNextPath(next)} />
      </div>
    </main>
  );
}
