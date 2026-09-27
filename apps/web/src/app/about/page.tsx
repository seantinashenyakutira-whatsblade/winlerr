import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { VoiceNoteReplay } from "@/components/VoiceNote";

export const metadata: Metadata = {
  title: "About",
  description:
    "Winlerr is built in Zambia, for Zambian businesses: a free professional website first, then the AI systems that answer, qualify, and follow up every lead.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-4 pt-28 sm:px-6 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">About</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Built in Zambia, for Zambian businesses.
        </h1>
        <div className="mt-6 space-y-4">
          <p className="text-base leading-relaxed text-ink-muted">
            I started Winlerr after watching business owners in Lusaka lose sales simply because
            they could not reach their phones in time. A customer asks for prices on WhatsApp,
            waits hours for a reply, and buys elsewhere. Good local businesses were not losing on
            quality, but on response speed.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            Most owners here run everything from one device while managing staff, stock, and
            customers. When enquiries arrive during busy rushes or late at night, messages sit
            unread and quotes go forgotten. Building a standard website usually brings high upfront
            fees and unnecessary delays.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            I believe practical technology should match how Zambians already communicate. Small
            businesses should not need complicated software or costly retainers to answer customer
            questions. Helpful tools should work quietly where buyers already spend their time,
            especially on WhatsApp.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            That is why we build your professional website for free first. It gives your business a
            credible presence without costing a single Kwacha upfront. Once that foundation is
            live, we connect the AI systems that answer, qualify, and follow up with leads 24/7.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            We are early-stage and working closely with our first client cohort, so every business
            matters to us. You will work directly with real people who configure your setup
            carefully and speak plainly. We will never sell you systems you do not need.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            If you are ready to stop losing enquiries, message me directly on WhatsApp. I will get
            your free website live and help your business grow.
          </p>
          <p className="text-sm font-semibold text-ink">— Sean, Founder, Winlerr</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          <h2 className="font-display text-xl font-bold">Hear from Sean</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Why Winlerr exists, explained in his own words.
          </p>
          <div className="mt-5">
            <VoiceNoteReplay label="Play the voice note" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="rounded-card border border-border bg-surface-tint p-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">Ready to win more customers?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink-muted">
            Tell us about your business and we will get your free website live.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/get-started" size="lg">
              Get your free website
            </Button>
            <Button href="/docs" variant="secondary" size="lg">
              Read the docs
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
