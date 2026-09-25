import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Systems",
  description:
    "Six Winlerr systems — lead response, WhatsApp AI agent, social DM agent, booking, customer follow-up, and AI receptionist — on one platform.",
  alternates: { canonical: "/systems" },
};

const SYSTEMS = [
  {
    name: "Lead Response",
    summary: "Every enquiry triaged and answered in seconds.",
    detail:
      "Calls, form submissions, WhatsApp messages, and DMs land in one queue, get a qualified first response, and are scored so you know who is ready to buy before you call.",
  },
  {
    name: "WhatsApp AI Agent",
    summary: "Customer conversations on autopilot, 24/7.",
    detail:
      "The channel Zambian customers already use, handled continuously. Your agent answers questions, captures the details you need, and hands off to a human at the right moment.",
  },
  {
    name: "Social DM Agent",
    summary: "Facebook and Instagram messages handled, qualified, and routed.",
    detail:
      "DMs from your Facebook and Instagram pages are answered from the same dashboard as everything else, then qualified and routed to the right person or system.",
  },
  {
    name: "Booking System",
    summary: "Appointments without the back-and-forth.",
    detail:
      "Let customers book the time that suits them instead of negotiating over messages. Confirmations and reminders go out automatically.",
  },
  {
    name: "Customer Follow-up",
    summary: "Quotes chased. Reviews requested. Nobody forgotten.",
    detail:
      "Every open quote and promised follow-up is tracked and chased for you, so enquiries do not go quiet between the first message and the sale.",
  },
  {
    name: "AI Receptionist",
    summary: "A front desk that never sleeps.",
    detail:
      "Answers after hours, on weekends, and on holidays. It captures the enquiry, books or qualifies it, and lets you get to work in the morning to a warm pipeline.",
  },
];

export default function SystemsPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-6 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Systems</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Six systems. One platform. Pick what your business needs.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ink-muted">
          Start with one system, configure it to your business, and add more as you grow.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          {SYSTEMS.map((system) => (
            <article
              key={system.name}
              className="rounded-card border border-border bg-surface p-6 shadow-card"
            >
              <h2 className="font-display text-lg font-bold">{system.name}</h2>
              <p className="mt-2 text-sm font-medium text-brand-600">{system.summary}</p>
              <p className="mt-3 text-sm text-ink-muted">{system.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-card border border-border bg-surface-tint p-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Not sure which one to start with?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted">
            Tell us how your business handles enquiries today and we will tell you which system
            closes the biggest gap first.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/get-started" size="lg">
              Get your free website
            </Button>
            <Button href="/docs/systems-overview" variant="secondary" size="lg">
              Read the docs
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
