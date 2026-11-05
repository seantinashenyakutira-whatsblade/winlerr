import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { LeadForm } from "@/components/sections/lead-form";
import { HeroVideo } from "@/components/HeroVideo";

export const metadata: Metadata = {
  title: "Get started",
  description:
    "Tell Winlerr about your business and discuss website, customer workflow, and WinlerrOS options.",
  alternates: { canonical: "/get-started" },
};

const STEPS = [
  {
    title: "Tell us about the business",
    body: "A few details: what you do, who you serve, and how people reach you today.",
  },
  {
    title: "Review the options",
    body: "Discuss website, customer workflow, and current product availability.",
  },
  {
    title: "Confirm scope and next steps",
    body: "Agree on requirements, integrations, and pricing before work begins.",
  },
];

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <section className="relative isolate overflow-hidden px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        <HeroVideo className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-50" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Get started</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Let&apos;s find the right next step for your business.
          </h1>
          <p className="mt-4 text-base text-ink-muted">
            Tell us about your business and what you want to improve. We&apos;ll discuss current
            product availability and fit. Already have an account?{" "}
            <a className="underline" href="/login">
              Sign in
            </a>{" "}
            — or{" "}
            <a className="underline" href="/signup">
              create one
            </a>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <span className="font-mono text-xs text-brand-600">Step {index + 1}</span>
              <h2 className="mt-2 text-sm font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div id="get-started" className="scroll-mt-24">
        <LeadForm />
      </div>

      <Footer />
    </main>
  );
}
