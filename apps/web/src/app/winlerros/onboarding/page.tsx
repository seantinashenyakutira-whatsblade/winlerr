import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleUserRound, Layers3 } from "lucide-react";
import { WinlerrLogo } from "@/components/winlerros/brand";

export const metadata: Metadata = { title: "Getting started with WinlerrOS", robots: { index: false, follow: false } };

const steps = [
  { number: "01", title: "Create your account", description: "Sign up with your work email and confirm your address before signing in." },
  { number: "02", title: "Create your workspace", description: "Save your business name and a unique workspace address to your account." },
  { number: "03", title: "Open your workspace list", description: "Your dashboard shows the workspaces returned for your signed-in account." },
];

export default function WinlerrOsOnboardingPage() {
  return (
    <main className="winlerros-page min-h-screen bg-surface-tint text-ink">
      <header className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <WinlerrLogo />
        <Link href="/winlerros" className="inline-flex items-center gap-2 text-sm text-[#475569]"><ArrowLeft size={15} />WinlerrOS overview</Link>
      </header>
      <section className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <p className="winlerros-eyebrow">A thoughtful start</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Get your workspace ready, one step at a time.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#475569]">Create your account, then save your workspace name and address. We show a completed setup only after the workspace action confirms success.</p>
        <ol className="mt-10 space-y-4">
          {steps.map(({ number, title, description }, index) => (
            <li key={number} className="flex gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:gap-6 sm:p-6">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-mono text-xs ${index === 0 ? "bg-ink text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>{index === 0 ? <Check size={17} /> : number}</span>
              <div><h2 className="font-semibold">{title}</h2><p className="mt-1.5 max-w-xl text-sm leading-6 text-[#475569]">{description}</p></div>
              <span className="ml-auto hidden text-[10px] font-semibold uppercase tracking-wider text-[#64748B] sm:block">{index === 0 ? "Start here" : "Next"}</span>
            </li>
          ))}
        </ol>
        <div className="mt-7 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-5">
          <div className="flex gap-3"><CircleUserRound className="mt-0.5 shrink-0 text-accent-500" size={19} /><div><h2 className="text-sm font-semibold">Workspace storage status</h2><p className="mt-1.5 text-sm leading-6 text-[#475569]">Workspace setup uses your signed-in session. If workspace storage is unavailable, WinlerrOS will show an error and will not report that the workspace was created.</p></div></div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white">Create account <ArrowRight size={16} /></Link>
          <Link href="/login?next=%2Fdashboard%2Fsetup" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-6 text-sm font-semibold">Sign in</Link>
          <Link href="/winlerros/preview" className="inline-flex h-12 items-center justify-center gap-2 px-3 text-sm font-medium text-[#64748B]">Explore preview <Layers3 size={15} /></Link>
        </div>
      </section>
    </main>
  );
}
