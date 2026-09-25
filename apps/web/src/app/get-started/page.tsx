import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { LeadForm } from "@/components/sections/lead-form";

export const metadata: Metadata = {
  title: "Get started",
  description:
    "Get a free professional website for your Zambian business, live in days — then set up your first AI system for lead response, WhatsApp, and booking.",
  alternates: { canonical: "/get-started" },
};

const STEPS = [
  {
    title: "Tell us about the business",
    body: "A few details: what you do, who you serve, and how people reach you today.",
  },
  {
    title: "We build your free website",
    body: "A professional page for your business, live in days — not weeks.",
  },
  {
    title: "We connect your first system",
    body: "WhatsApp, Facebook, Instagram, or your phone — whichever you already use.",
  },
];

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-4 pt-28 sm:px-6 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Get started</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Ready to win more customers?
        </h1>
        <p className="mt-4 text-base text-ink-muted">
          Tell us about your business. We&apos;ll get your free website live and set up your first
          system.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-card border border-border bg-surface p-5 shadow-card">
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
