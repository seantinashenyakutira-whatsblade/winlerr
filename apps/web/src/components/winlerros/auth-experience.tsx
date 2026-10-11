"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { WinlerrLogo } from "@/components/winlerros/brand";

type AuthMode = "login" | "signup";

const stateCopy: Record<string, { title: string; body: string; tone: "info" | "error" | "success" }> = {
  confirmation: { title: "Check your email", body: "Open the confirmation link sent to your email to activate your account.", tone: "success" },
  expired: { title: "That link has expired", body: "Request a fresh sign-in or confirmation link to continue.", tone: "error" },
  error: { title: "We could not complete that request", body: "Please try again. If this continues, contact Winlerr support.", tone: "error" },
  success: { title: "Email confirmed", body: "Your email is confirmed. Sign in to continue to WinlerrOS.", tone: "success" },
  loading: { title: "Connecting securely", body: "Your account request is being processed securely.", tone: "info" },
};

export function AuthExperience({ mode, form }: { mode: AuthMode; form: ReactNode }) {
  const search = useSearchParams();
  const state = search.get("state");
  const notice = state ? stateCopy[state] : undefined;
  const signup = mode === "signup";

  return (
    <main className="winlerros-page min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_0.86fr] lg:px-8">
        <section className="hidden min-h-[620px] flex-col justify-between rounded-[30px] bg-ink p-10 text-white lg:flex">
          <WinlerrLogo inverse />
          <div className="max-w-lg">
            <span className="winlerros-eyebrow text-[#FDBA74]">One calm place to run your business</span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.08] tracking-tight">Good work deserves a system that keeps up.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">Bring your customers, follow-ups and daily operations into a workspace built for the way local businesses work.</p>
          </div>
          <p className="text-sm text-white/70">WinlerrOS · Built for growing businesses</p>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-12 flex items-center justify-between lg:hidden"><WinlerrLogo /><Link className="text-sm text-slate-600 hover:text-ink" href="/winlerros">WinlerrOS overview</Link></div>
          <Link href="/winlerros" className="mb-9 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-ink"><ArrowLeft size={16} /> Back to WinlerrOS</Link>
          <p className="winlerros-eyebrow">{signup ? "Start your workspace" : "Welcome back"}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">{signup ? "Create your account" : "Sign in to WinlerrOS"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{signup ? "Set up your login first. Workspace setup follows after account confirmation." : "Use the email and password connected to your WinlerrOS account."}</p>

          {notice && <div role={notice.tone === "error" ? "alert" : "status"} className={`mt-7 flex gap-3 rounded-2xl border p-4 text-sm ${notice.tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>
            {notice.tone === "error" ? <CircleAlert size={19} className="mt-0.5 shrink-0" /> : notice.tone === "info" ? <LoaderCircle size={19} className="mt-0.5 shrink-0 animate-spin" /> : <CheckCircle2 size={19} className="mt-0.5 shrink-0" />}
            <span><strong className="block font-semibold">{notice.title}</strong><span className="mt-1 block leading-5">{notice.body}</span></span>
          </div>}

          <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(17,24,39,.06)] sm:p-8">
            {form}
            <p className="mt-5 text-center text-sm text-slate-600">{signup ? "Already have an account? " : "New to WinlerrOS? "}<Link href={signup ? "/login" : "/signup"} className="font-semibold text-brand-600 underline underline-offset-4">{signup ? "Sign in" : "Create an account"}</Link></p>
          </div>
          <p className="mt-7 text-center text-xs text-slate-600">Your account session is protected by secure httpOnly cookies.</p>
        </section>
      </div>
    </main>
  );
}
