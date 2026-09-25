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
        <p className="mt-6 text-base text-ink-muted">
          Winlerr exists because most Zambian businesses do not lose customers to a bad product. They
          lose them to a missed call, a reply that comes tomorrow, and a follow-up nobody sends.
        </p>
        <p className="mt-4 text-base text-ink-muted">
          So we start with the part that should never have been a barrier: a professional website,
          free, live in days. Then we add the systems that answer, qualify, and follow up — on
          WhatsApp first, because that is where the conversations already are.
        </p>
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
