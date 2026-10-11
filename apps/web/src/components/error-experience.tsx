"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Compass,
  Home,
  LockKeyhole,
  RefreshCw,
  WifiOff,
} from "lucide-react";

type ErrorVariant =
  | "not-found"
  | "unexpected"
  | "fatal"
  | "access-denied"
  | "session-expired"
  | "workspace-unavailable"
  | "service-unavailable";

type RecoveryAction = {
  label: string;
  href?: string;
  kind?: "retry";
  secondary?: boolean;
};

const copy: Record<ErrorVariant, {
  eyebrow: string;
  code: string;
  title: string;
  body: string;
  icon: typeof Compass;
  actions: RecoveryAction[];
  support?: boolean;
}> = {
  "not-found": {
    eyebrow: "Page not found",
    code: "404",
    title: "Looks like this page took a different route.",
    body: "The page may have moved, or the address may be incomplete. Choose a place to continue from.",
    icon: Compass,
    actions: [
      { label: "Back to Winlerr", href: "/" },
      { label: "Explore WinlerrOS", href: "/winlerros", secondary: true },
    ],
  },
  unexpected: {
    eyebrow: "Something went wrong",
    code: "OOPS",
    title: "We hit a snag.",
    body: "Your work hasn’t been confirmed as saved. Try again, or head back to a page that’s ready for you.",
    icon: CircleAlert,
    actions: [
      { label: "Try again", kind: "retry" },
      { label: "Go to WinlerrOS", href: "/winlerros", secondary: true },
    ],
    support: true,
  },
  fatal: {
    eyebrow: "Winlerr is restarting",
    code: "W/",
    title: "We’re having trouble opening this page.",
    body: "Reload the page to try again, or continue to WinlerrOS. If the problem keeps happening, our team can help.",
    icon: CircleAlert,
    actions: [
      { label: "Reload page", kind: "retry" },
      { label: "WinlerrOS home", href: "/winlerros", secondary: true },
    ],
    support: true,
  },
  "access-denied": {
    eyebrow: "Access restricted",
    code: "403",
    title: "This area isn’t available to your account.",
    body: "If you think you should have access, ask a workspace owner or contact our support team.",
    icon: LockKeyhole,
    actions: [
      { label: "Return to dashboard", href: "/dashboard" },
      { label: "Go to WinlerrOS", href: "/winlerros", secondary: true },
    ],
    support: true,
  },
  "session-expired": {
    eyebrow: "Sign in to continue",
    code: "LOGIN",
    title: "Your session has ended.",
    body: "Sign in again to return to your WinlerrOS dashboard.",
    icon: LockKeyhole,
    actions: [
      { label: "Sign in again", href: "/login?next=%2Fdashboard" },
      { label: "Back to Winlerr", href: "/", secondary: true },
    ],
  },
  "workspace-unavailable": {
    eyebrow: "Workspace unavailable",
    code: "W/OS",
    title: "We couldn’t load this workspace right now.",
    body: "Try again, or return to your dashboard. We’ll only show workspace details once we can confirm them.",
    icon: CircleAlert,
    actions: [
      { label: "Try again", kind: "retry" },
      { label: "Return to dashboard", href: "/dashboard", secondary: true },
    ],
    support: true,
  },
  "service-unavailable": {
    eyebrow: "Connection issue",
    code: "OFFLINE",
    title: "We can’t reach Winlerr right now.",
    body: "Check your connection and try again. Your account and workspace details stay protected while you reconnect.",
    icon: WifiOff,
    actions: [
      { label: "Try again", kind: "retry" },
      { label: "WinlerrOS home", href: "/winlerros", secondary: true },
      { label: "Return to dashboard", href: "/dashboard", secondary: true },
    ],
    support: true,
  },
};

function Action({ action, onRetry }: { action: RecoveryAction; onRetry: () => void }) {
  const className = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
    action.secondary
      ? "border border-[#CBD5E1] bg-white text-[#111827] hover:bg-[#F1F5F9]"
      : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
  }`;

  if (action.kind === "retry") {
    return (
      <button type="button" className={className} onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" />
        {action.label}
      </button>
    );
  }

  return (
    <Link href={action.href ?? "/"} className={className}>
      {action.secondary ? <ArrowLeft size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
      {action.label}
    </Link>
  );
}

export function ErrorExperience({
  variant,
  reset,
  compact = false,
}: {
  variant: ErrorVariant;
  reset?: () => void;
  compact?: boolean;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const offline = !isOnline && (variant === "service-unavailable" || variant === "workspace-unavailable");
  const content = offline ? copy["service-unavailable"] : copy[variant];
  const Icon = content.icon;
  const onRetry = reset ?? (() => window.location.reload());

  useEffect(() => {
    document.body.dataset.winlerrErrorPage = "true";
    const updateOnline = () => setIsOnline(window.navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      delete document.body.dataset.winlerrErrorPage;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const body = offline
    ? "Your device appears to be offline. Reconnect to the internet, then try again."
    : content.body;

  if (compact) {
    return (
      <section aria-labelledby="recovery-title" role="alert" className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-5 text-[#111827] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#C2410C]" aria-hidden="true"><Icon size={19} /></span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#9A3412]">{content.eyebrow}</p>
            <h2 id="recovery-title" className="mt-1 font-display text-lg font-semibold">{content.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#475569]">{body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.actions.map((action) => <Action key={action.label} action={action} onRetry={onRetry} />)}
            </div>
            {content.support && <p className="mt-4 text-xs text-[#475569]">Still stuck? <a className="font-semibold text-[#1D4ED8] underline underline-offset-2" href="mailto:support@winlerr.vip">Contact support</a>.</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="error-experience flex min-h-screen flex-col bg-[#F8FAFC] text-[#111827]">
      <header className="border-b border-white/10 bg-[#111827] text-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Winlerr home" className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#60A5FA]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-xs font-bold tracking-tight text-[#111827]" aria-hidden="true">W/</span>
            <span className="font-display text-lg font-semibold tracking-tight">winlerr</span>
          </Link>
          <Link href="/winlerros" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]">
            WinlerrOS <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_.9fr] lg:gap-20">
        <section aria-labelledby="error-title" className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-[#2563EB]">{content.eyebrow}</p>
          <h1 id="error-title" className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.08] tracking-[-.035em] sm:text-5xl">{content.title}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#475569]">{body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {content.actions.map((action) => <Action key={action.label} action={action} onRetry={onRetry} />)}
          </div>
          {content.support && <p className="mt-7 text-sm text-[#64748B]">Need a hand? <a href="mailto:support@winlerr.vip" className="font-semibold text-[#1D4ED8] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">support@winlerr.vip</a></p>}
          <p className="mt-8 font-mono text-[11px] tracking-wide text-[#94A3B8]">{content.code}</p>
        </section>

        <div aria-hidden="true" className="relative mx-auto w-full max-w-[440px]">
          <div className="absolute -right-3 -top-4 h-24 w-24 rounded-full border border-[#FDBA74] sm:-right-6 sm:-top-6" />
          <div className="absolute -bottom-5 -left-4 h-16 w-16 rounded-full bg-[#DBEAFE] sm:-left-7" />
          <div className="relative overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-[0_24px_70px_rgba(17,24,39,.09)] sm:p-7">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#111827] text-[10px] font-bold text-white">W/</span><span className="text-sm font-semibold">WinlerrOS</span></div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">Recovery</span>
            </div>
            <div className="relative mt-6 grid min-h-[236px] place-items-center overflow-hidden rounded-2xl bg-[#F8FAFC]">
              <div className="absolute h-44 w-44 rounded-full border border-dashed border-[#CBD5E1]" />
              <div className="absolute h-32 w-32 rounded-full border border-[#E2E8F0]" />
              <div className="relative grid h-20 w-20 place-items-center rounded-[24px] bg-[#111827] text-white shadow-lg shadow-slate-900/15">
                <Icon size={31} strokeWidth={1.8} />
                <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full border-[3px] border-white bg-[#F97316]" />
              </div>
              <span className="absolute left-[14%] top-[25%] h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              <span className="absolute bottom-[23%] right-[18%] h-3 w-3 rounded-full bg-[#F97316]" />
              <span className="absolute bottom-5 font-mono text-[10px] font-medium uppercase tracking-[.18em] text-[#64748B]">{content.code}</span>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#475569]"><span className="h-2 w-2 rounded-full bg-[#F97316]" />Ready when you are</span>
              <Home size={15} className="text-[#2563EB]" />
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex min-h-[64px] max-w-6xl items-center justify-between gap-4 px-5 text-xs text-[#64748B] sm:px-8">
          <span>Winlerr · Built for what’s next.</span>
          <Link href="/get-started" className="inline-flex min-h-11 items-center rounded-lg px-2 font-medium hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">Contact us</Link>
        </div>
      </footer>
    </main>
  );
}
