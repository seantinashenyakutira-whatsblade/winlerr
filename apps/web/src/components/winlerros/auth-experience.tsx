"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, LockKeyhole, Mail } from "lucide-react";
import { WinlerrLogo } from "@/components/winlerr-logo";

type AuthMode = "login" | "signup";

const stateCopy: Record<string, { title: string; body: string; tone: "info" | "error" | "success" }> = {
  confirmation: { title: "Email confirmation preview", body: "No email has been sent. The live authentication service will show delivery status here once connected.", tone: "info" },
  expired: { title: "That link has expired", body: "Request a fresh sign-in or confirmation link to continue.", tone: "error" },
  error: { title: "We could not complete that request", body: "Please try again. If this continues, contact Winlerr support.", tone: "error" },
  success: { title: "Example success state", body: "This is a visual state preview only. A real account can only be confirmed by the authentication service.", tone: "success" },
  loading: { title: "Connecting securely", body: "Loading state preview. The live route will show progress while the auth service responds.", tone: "info" },
};

export function AuthExperience({ mode }: { mode: AuthMode }) {
  const search = useSearchParams();
  const state = search.get("state");
  const notice = state ? stateCopy[state] : undefined;
  const signup = mode === "signup";

  return (
    <main className="winlerros-page min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_0.86fr] lg:px-8">
        <section className="hidden min-h-[620px] flex-col justify-between rounded-[30px] bg-[#111827] p-10 text-[#ffffff] lg:flex">
          <WinlerrLogo href="/winlerros" product inverse />
          <div className="max-w-lg">
            <span className="winlerros-eyebrow text-[#fdba74]">One calm place to run your business</span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.08] tracking-tight">Good work deserves a system that keeps up.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">Bring your customers, follow-ups and daily operations into a workspace built for the way local businesses work.</p>
          </div>
          <p className="text-sm text-white/55">WinlerrOS · Built for growing businesses</p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-12 flex items-center justify-between lg:hidden"><WinlerrLogo href="/winlerros" product/><Link className="text-sm text-[#475569] hover:text-[#111827]" href="/winlerros">WinlerrOS overview</Link></div>
          <Link href="/winlerros" className="mb-9 inline-flex items-center gap-2 text-sm text-[#607168] transition hover:text-[#111827]"><ArrowLeft size={16} /> Back to WinlerrOS</Link>
          <p className="winlerros-eyebrow">{signup ? "Start your workspace" : "Welcome back"}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[#111827]">{signup ? "Create your account" : "Sign in to WinlerrOS"}</h1>
          <p className="mt-3 text-sm leading-6 text-[#607168]">{signup ? "Set up your login first. Workspace setup follows after account confirmation." : "Use the email and password connected to your WinlerrOS account."}</p>

          {notice && <div role={notice.tone === "error" ? "alert" : "status"} className={`mt-7 flex gap-3 rounded-2xl border p-4 text-sm ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-[#bfdbfe] bg-[#edf6ef] text-[#1e3a8a]"}`}>
            {notice.tone === "error" ? <CircleAlert size={19} className="mt-0.5 shrink-0" /> : notice.tone === "info" ? <CircleAlert size={19} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={19} className="mt-0.5 shrink-0" />}
            <span><strong className="block font-semibold">{notice.title}</strong><span className="mt-1 block leading-5">{notice.body}</span></span>
          </div>}

          <div className="mt-8 rounded-[24px] border border-[#e2e8f0] bg-white p-6 shadow-[0_12px_32px_rgba(28,52,41,.06)] sm:p-8">
            <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-[#111827]">Work email</label>
            <div className="relative"><Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829087]"/><input id="auth-email" name="email" autoComplete="email" type="email" placeholder="you@business.co.zm" className="winlerros-input pl-10" disabled /></div>
            <label htmlFor="auth-password" className="mb-2 mt-5 block text-sm font-medium text-[#111827]">Password</label>
            <div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829087]"/><input id="auth-password" name="password" autoComplete={signup ? "new-password" : "current-password"} type="password" placeholder="At least 8 characters" className="winlerros-input pl-10" disabled /></div>
            <p className="mt-3 rounded-xl bg-[#f8fafc] px-3.5 py-3 text-xs leading-5 text-[#69766d]">Account authentication is waiting for the backend integration to merge. No credentials are submitted from this preview.</p>
            <button type="button" disabled className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white opacity-55">{signup ? "Create account" : "Sign in"}<ArrowRight size={16}/></button>
            <p className="mt-5 text-center text-sm text-[#66746b]">{signup ? "Already have an account? " : "New to WinlerrOS? "}<Link href={signup ? "/login" : "/signup"} className="font-semibold text-[#2563eb] underline decoration-[#93c5fd] underline-offset-4">{signup ? "Sign in" : "Create an account"}</Link></p>
          </div>
          <p className="mt-7 text-center text-xs text-[#849087]">Your account session will be secured with httpOnly cookies.</p>
        </section>
      </div>
    </main>
  );
}
