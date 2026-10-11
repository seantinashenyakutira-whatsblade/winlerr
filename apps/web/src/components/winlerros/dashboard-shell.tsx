"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  CircleAlert,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import type { OrganizationWithRole, WorkspaceErrorCode } from "@winlerr/workspace";
import { WinlerrLogo } from "@/components/winlerros/brand";

export function DashboardShell({
  preview = false,
  accountEmail,
  onSignOut,
  organizations,
  workspaceError,
}: {
  preview?: boolean;
  accountEmail?: string | null;
  onSignOut?: () => Promise<void>;
  organizations?: OrganizationWithRole[] | null;
  workspaceError?: WorkspaceErrorCode;
}) {
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const hasOrganizations = Boolean(organizations?.length);

  return (
    <div className="winlerros-page min-h-screen bg-surface-tint text-ink">
      {preview && (
        <div className="flex items-center justify-center gap-2 bg-[#EFF6FF] px-4 py-2 text-center text-xs font-medium text-[#1E3A8A]">
          Product preview · no account or organization data is connected
          <span className="hidden sm:inline">·</span>
          <Link className="underline underline-offset-2" href="/winlerros">Learn about WinlerrOS</Link>
        </div>
      )}
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-white/10 bg-ink px-5 py-6 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between">
            <WinlerrLogo inverse />
            <button aria-label="Close navigation" onClick={() => setMenu(false)} className="rounded-lg p-2 text-white/70 lg:hidden"><X size={18} /></button>
          </div>
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500 text-ink"><BriefcaseBusiness size={19} /></span>
            <span><span className="block text-sm font-semibold">Workspaces</span><span className="mt-0.5 block text-xs text-white/55">Account overview</span></span>
          </div>
          <p className="mb-2 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Workspace</p>
          <nav aria-label="Workspace navigation" className="space-y-1">
            <Link href="/dashboard" onClick={() => setMenu(false)} className="flex min-h-11 items-center gap-3 rounded-xl bg-white/10 px-3 text-sm text-white"><LayoutDashboard size={17} />Overview</Link>
            <Link href="/dashboard/setup" onClick={() => setMenu(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/65 hover:bg-white/[0.07] hover:text-white"><BriefcaseBusiness size={17} />Create a workspace</Link>
          </nav>
          <div className="mt-auto rounded-2xl bg-[#1E3A8A] p-4">
            <span className="text-xs font-semibold">Need a hand getting started?</span>
            <p className="mt-1.5 text-xs leading-5 text-white/70">Learn how workspace setup works in WinlerrOS.</p>
            <Link href="/winlerros/onboarding" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FDBA74]">Onboarding guide <ArrowRight size={13} /></Link>
          </div>
        </aside>
        {menu && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMenu(false)} />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#E2E8F0] bg-surface-tint/95 px-4 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation" onClick={() => setMenu(true)} className="rounded-lg p-2 hover:bg-[#F1F5F9] lg:hidden"><Menu size={19} /></button>
              <span className="text-sm text-[#64748B]">WinlerrOS <span className="mx-1.5">/</span><strong className="font-medium text-ink">Workspaces</strong></span>
            </div>
            <div className="relative">
              <button aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white p-1 pr-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#DBEAFE] text-xs font-semibold text-[#1E3A8A]">{accountEmail?.slice(0, 1).toUpperCase() ?? "U"}</span>
                <span className="hidden max-w-40 truncate text-xs font-medium sm:block">{accountEmail ?? "Your account"}</span>
                <ChevronDown className="hidden sm:block" size={14} />
              </button>
              {profileOpen && (
                <div role="menu" aria-label="Account menu" className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_12px_32px_rgba(17,24,39,.12)]">
                  {onSignOut ? <>
                    <p className="px-3 py-2 text-xs text-[#64748B]">{accountEmail ?? "Signed in"}</p>
                    <button role="menuitem" onClick={() => void onSignOut()} className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-tint">Sign out</button>
                  </> : <>
                    <p className="px-3 py-2 text-xs text-[#64748B]">Account session unavailable in preview</p>
                    <Link role="menuitem" href="/login" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-tint">Sign in</Link>
                  </>}
                </div>
              )}
            </div>
          </header>

          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="winlerros-eyebrow">Workspace overview</p>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-[38px]">Your workspaces</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#475569]">Workspace details shown here come from your account. Customer, sales, and activity data are not connected yet.</p>
              </div>
              {!preview && <Link href="/dashboard/setup" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"><BriefcaseBusiness size={17} />Create workspace</Link>}
            </div>

            <section aria-label="Workspace data" className="mt-8">
              {organizations === null ? (
                <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 sm:p-6">
                  <div className="flex items-start gap-3"><CircleAlert size={19} className="mt-0.5 shrink-0" /><div><h2 className="font-semibold">Workspace data is unavailable</h2><p className="mt-1 leading-6">{workspaceError === "unauthorized" ? "Your session could not be verified for workspace data. Please sign in again." : "We couldn’t load your workspaces. Workspace storage may not be available yet. Please try again later."}</p>{workspaceError === "unauthorized" && <Link href="/login?next=%2Fdashboard" className="mt-3 inline-flex font-semibold underline underline-offset-2">Sign in again</Link>}</div></div>
                </div>
              ) : hasOrganizations ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {organizations?.map((organization) => (
                    <article key={organization.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EFF6FF] text-brand-600"><BriefcaseBusiness size={20} /></span>
                        <div className="min-w-0"><h2 className="truncate font-semibold">{organization.name}</h2><p className="mt-1 break-all text-sm text-[#64748B]">winlerros.app/{organization.slug}</p><p className="mt-3 text-xs text-[#64748B]">{organization.role}</p></div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-7 text-center sm:p-10">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EFF6FF] text-brand-600"><BriefcaseBusiness size={21} /></span>
                  <h2 className="mt-4 font-display text-xl font-semibold">No workspace yet</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">Create a workspace to save your business name and workspace address to your account.</p>
                  {!preview ? <Link href="/dashboard/setup" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">Create your workspace <ArrowRight size={15} /></Link> : <Link href="/winlerros/onboarding" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] px-5 text-sm font-semibold hover:bg-surface-tint">How setup works <ArrowRight size={15} /></Link>}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
