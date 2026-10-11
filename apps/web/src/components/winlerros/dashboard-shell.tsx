"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownRight, ArrowRight, Bell, Blocks, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, CircleHelp, CreditCard, LayoutDashboard, Menu, MessageSquareText, Package, Plus, Settings2, Users, X } from "lucide-react";
import { WinlerrLogo } from "@/components/winlerros/brand";

const navigation = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Customers", icon: Users }, { label: "Conversations", icon: MessageSquareText }, { label: "Sales", icon: CreditCard }, { label: "Products & stock", icon: Package }, { label: "Reports", icon: ChartNoAxesCombined },
];

const modules = [
  { title: "Customer inbox", description: "Keep enquiries and follow-ups together.", icon: MessageSquareText, tag: "Coming next" },
  { title: "Sales & payments", description: "Track orders, invoices and what is owed.", icon: CreditCard, tag: "Coming next" },
  { title: "Products & stock", description: "See what is moving and what needs a restock.", icon: Package, tag: "Coming next" },
  { title: "Team & workspace", description: "Bring your people into one shared system.", icon: Users, tag: "Setup" },
];

export function DashboardShell({
  preview = false,
  accountEmail,
  onSignOut,
}: {
  preview?: boolean;
  /** Live session account. Absent = preview mode (existing placeholder UI). */
  accountEmail?: string | null;
  /** Server action invoked on sign-out. Absent = sign-out stays disabled. */
  onSignOut?: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <div className="winlerros-page min-h-screen bg-surface-tint text-ink">
      {preview && <div className="flex items-center justify-center gap-2 bg-[#EFF6FF] px-4 py-2 text-center text-xs font-medium text-[#1E3A8A]">Product preview · no account data is connected <span className="hidden sm:inline">·</span><Link className="underline underline-offset-2" href="/winlerros">Learn about WinlerrOS</Link></div>}
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-white/10 bg-ink px-5 py-6 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between"><WinlerrLogo inverse/><button aria-label="Close navigation" onClick={() => setMenu(false)} className="rounded-lg p-2 text-white/70 lg:hidden"><X size={18}/></button></div>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500 text-sm font-bold text-ink">W</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">Your workspace</span><span className="mt-0.5 block text-xs text-white/55">Setup not complete</span></span><ChevronDown size={15} className="ml-auto text-white/55"/></div></div>
          <p className="mb-2 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Workspace</p>
          <nav aria-label="Workspace navigation" className="space-y-1">{navigation.map(({ label, icon: Icon }, index) => <Link key={label} href={index === 0 ? "/winlerros/preview" : "/dashboard/setup"} onClick={() => setMenu(false)} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${index === 0 ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><Icon size={17}/>{label}{index > 0 && <span className="ml-auto text-[10px] text-white/35">Soon</span>}</Link>)}</nav>
          <p className="mb-2 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Manage</p>
          <Link href="/dashboard/setup" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/65 hover:bg-white/[0.07]"><Settings2 size={17}/>Workspace settings</Link>
          <div className="mt-auto rounded-2xl bg-[#1E3A8A] p-4"><span className="text-xs font-semibold">A little help goes a long way.</span><p className="mt-1.5 text-xs leading-5 text-white/60">We’ll guide you through getting your workspace ready.</p><Link href="/winlerros/onboarding" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FDBA74]">How it works <ArrowRight size={13}/></Link></div>
        </aside>
        {menu && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMenu(false)} />}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#E2E8F0] bg-surface-tint/95 px-4 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setMenu(true)} className="rounded-lg p-2 hover:bg-[#F1F5F9] lg:hidden"><Menu size={19}/></button><span className="text-sm text-[#64748B]">Workspace <span className="mx-1.5">/</span><strong className="font-medium text-ink">Overview</strong></span></div>
            <div className="flex items-center gap-2 sm:gap-4"><button aria-label="Help" className="hidden rounded-xl p-2.5 text-[#475569] hover:bg-[#F1F5F9] sm:block"><CircleHelp size={18}/></button><button aria-label="Notifications" className="rounded-xl p-2.5 text-[#475569] hover:bg-[#F1F5F9]"><Bell size={18}/></button><div className="relative"><button aria-label="Open account menu" aria-expanded={profileOpen} onClick={()=>setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white p-1 pr-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#DBEAFE] text-xs font-semibold text-[#1E3A8A]">U</span><span className="hidden max-w-40 truncate text-xs font-medium sm:block">{accountEmail ?? "Your account"}</span><ChevronDown className="hidden sm:block" size={14}/></button>{profileOpen&&<div role="menu" aria-label="Account menu" className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_12px_32px_rgba(17,24,39,.12)]">{onSignOut ? (<><p className="px-3 py-2 text-xs text-[#64748B]">{accountEmail ?? "Signed in"}</p><button role="menuitem" onClick={() => void onSignOut()} className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-tint">Sign out</button></>) : (<><p className="px-3 py-2 text-xs text-[#64748B]">Account session unavailable in preview</p><Link role="menuitem" href="/login" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface-tint">Sign in</Link><button role="menuitem" disabled title="This is a preview without an account session" className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[#64748B]">Sign out unavailable in preview</button></>)}</div>}</div></div>
          </header>
          <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10">
            <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="winlerros-eyebrow">Tuesday · Your business at a glance</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-[38px]">A good morning starts here.</h1><p className="mt-2 text-sm text-[#475569]">Your workspace is ready for its first details.</p></div><Link href="/dashboard/setup" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"><Plus size={17}/> Set up workspace</Link></section>
            <section aria-label="Workspace setup progress" className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_16px_rgba(17,24,39,.035)] sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF7ED] text-accent-600"><BriefcaseBusiness size={20}/></span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Make this workspace yours</h2><span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9A3412]">Step 1 of 3</span></div><p className="mt-1 text-sm text-[#64748B]">Add your business details to prepare your workspace. This preview does not save changes.</p></div><Link href="/dashboard/setup" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">Continue setup <ArrowRight size={15}/></Link></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]"><div className="h-full w-1/3 rounded-full bg-brand-600"/></div></section>
            <section aria-label="Business overview" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{label:"New enquiries",value:"—",caption:"Connect your inbox to get started",icon:MessageSquareText},{label:"Customers",value:"—",caption:"Your customer list will appear here",icon:Users},{label:"Sales this month",value:"—",caption:"Record your first sale",icon:CreditCard},{label:"Follow-ups due",value:"—",caption:"Nothing to follow up yet",icon:Activity}].map(({label,value,caption,icon:Icon})=><article key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#475569]">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EFF6FF] text-brand-600"><Icon size={17}/></span></div><p className="mt-5 font-display text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#64748B]">{caption}</p></article>)}</section>
            <section className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.8fr]"><article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-lg font-semibold">Your business tools</h2><p className="mt-1 text-sm text-[#64748B]">Start with the tools that make daily work easier.</p></div><Blocks size={19} className="text-brand-600"/></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{modules.map(({title,description,icon:Icon,tag})=><Link href="/dashboard/setup" key={title} className="group rounded-xl border border-[#E2E8F0] p-4 transition hover:border-[#BFDBFE] hover:bg-surface-tint"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EFF6FF] text-brand-600"><Icon size={17}/></span><span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-medium text-[#475569]">{tag}</span></div><h3 className="mt-4 text-sm font-semibold group-hover:text-accent-600">{title}</h3><p className="mt-1 text-xs leading-5 text-[#64748B]">{description}</p></Link>)}</div></article>
              <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Recent activity</h2><p className="mt-1 text-sm text-[#64748B]">Updates from your workspace.</p></div><ArrowDownRight size={18} className="text-brand-600"/></div><div className="mt-7 flex min-h-52 flex-col items-center justify-center rounded-xl bg-surface-tint px-5 text-center"><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-600 shadow-sm"><Activity size={19}/></span><h3 className="mt-4 text-sm font-semibold">Your story starts here</h3><p className="mt-1 max-w-xs text-xs leading-5 text-[#64748B]">Once your workspace is connected, important updates will show up here.</p></div></article>
            </section>
            <p className="mt-8 flex items-center gap-2 text-xs text-[#64748B]"><span className="h-2 w-2 rounded-full bg-accent-500"/> UI preview: no organization or activity data is persisted.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
