"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";
import { WORKSPACE_ERROR_COPY } from "@winlerr/workspace";
import { WinlerrLogo } from "@/components/winlerros/brand";
import { createOrganizationAction } from "@/lib/workspace-actions";
import {
  slugFromWorkspaceName,
  submitWorkspace,
  type CreateOrganization,
} from "@/lib/workspace-onboarding";

function errorMessage(error: keyof typeof WORKSPACE_ERROR_COPY): string {
  if (error === "unknown") {
    return "Workspace storage is unavailable or could not confirm setup. The workspace was not confirmed as created. Please try again later.";
  }
  return WORKSPACE_ERROR_COPY[error];
}

export function WorkspaceSetupForm({
  createOrganization = createOrganizationAction,
}: {
  createOrganization?: CreateOrganization;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<keyof typeof WORKSPACE_ERROR_COPY | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await submitWorkspace({ name, slug }, createOrganization);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="winlerros-page min-h-screen bg-surface-tint px-5 py-6 text-ink sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <WinlerrLogo />
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#475569]">
          <ArrowLeft size={15} /> Dashboard
        </Link>
      </header>
      <section className="mx-auto max-w-2xl pb-16 pt-12 sm:pt-16">
        <p className="winlerros-eyebrow">Workspace setup</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Create your workspace.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#475569]">
          Choose a name and a unique address for your business workspace. We’ll save it to your account when setup succeeds.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-[24px] border border-[#E2E8F0] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,.05)] sm:p-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="workspace-name" className="mb-2 block text-sm font-medium">
                Business or workspace name
              </label>
              <input
                id="workspace-name"
                name="name"
                autoComplete="organization"
                required
                maxLength={120}
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slugEdited) setSlug(slugFromWorkspaceName(nextName));
                }}
                placeholder="e.g. Lumwana Traders"
                className="winlerros-input"
                aria-invalid={error === "invalid-name"}
              />
            </div>
            <div>
              <label htmlFor="workspace-slug" className="mb-2 block text-sm font-medium">
                Workspace address
              </label>
              <div className="flex min-h-[46px] items-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                <span aria-hidden="true" className="pl-3 text-sm text-[#64748B] sm:pl-4">winlerros.app/</span>
                <input
                  id="workspace-slug"
                  name="slug"
                  autoComplete="off"
                  required
                  maxLength={64}
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(event.target.value);
                  }}
                  placeholder="lumwana-traders"
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm text-ink outline-none focus:ring-0"
                  aria-describedby="workspace-slug-hint"
                  aria-invalid={error === "invalid-slug" || error === "slug-taken"}
                />
              </div>
              <p id="workspace-slug-hint" className="mt-2 text-xs leading-5 text-[#64748B]">
                Use lowercase letters, numbers, and hyphens. You can edit the suggested address.
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="flex items-start gap-2"><CircleAlert size={17} className="mt-0.5 shrink-0" />{errorMessage(error)}</p>
              {error === "unauthorized" && (
                <Link href="/login?next=%2Fdashboard%2Fsetup" className="mt-3 inline-flex font-semibold underline underline-offset-2">
                  Sign in to continue
                </Link>
              )}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-[#475569] hover:bg-[#F1F5F9]">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Creating workspace…" : "Create workspace"}
              {!pending && <ArrowRight size={15} />}
            </button>
          </div>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-[#64748B]">
          We’ll only show a completed setup after the workspace action confirms it was created.
        </p>
      </section>
    </main>
  );
}
