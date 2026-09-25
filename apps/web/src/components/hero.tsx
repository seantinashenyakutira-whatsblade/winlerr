"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellRing, CalendarCheck, MessageCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHIPS = [
  { label: "Lead Response", icon: Zap, className: "left-[2%] top-[8%]" },
  { label: "WhatsApp AI", icon: MessageCircle, className: "right-[2%] top-[22%]" },
  { label: "Booking", icon: CalendarCheck, className: "left-[6%] bottom-[10%]" },
  { label: "Follow-up", icon: BellRing, className: "right-[6%] bottom-[4%]" },
];

function floatDuration(index: number): number {
  return 6 + index * 0.7;
}

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="rounded-pill border border-border bg-surface px-4 py-1.5 text-xs font-medium text-ink-muted">
            Free website
          </span>
          <span className="rounded-pill border border-border bg-surface px-4 py-1.5 text-xs font-medium text-ink-muted">
            AI-powered
          </span>
        </div>

        <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          [HEADLINE PLACEHOLDER] with{" "}
          <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
            winlerr
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted sm:text-lg">
          [SUBHEADLINE PLACEHOLDER — line one: who Winlerr serves.]
          <br />
          [SUBHEADLINE PLACEHOLDER — line two: the outcome in one breath.]
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="#get-started" size="lg">
            Get your free website
          </Button>
          <Button href="#how" variant="secondary" size="lg">
            See how it works
          </Button>
        </div>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[720px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-3xl"
          />
          <div className="rounded-card border border-border bg-surface p-4 text-left shadow-card sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-accent-400" />
              <span className="h-3 w-3 rounded-full bg-accent-500" />
              <span className="h-3 w-3 rounded-full bg-brand-400" />
              <span className="ml-2 font-mono text-xs text-ink-muted">[DASHBOARD PREVIEW PLACEHOLDER]</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <div key={card} className="rounded-card border border-border bg-surface-tint p-4">
                  <div className="mb-3 h-2.5 w-2/3 rounded-pill bg-ink/10" />
                  <div className="mb-2 h-2.5 w-full rounded-pill bg-ink/10" />
                  <div className="h-2.5 w-1/2 rounded-pill bg-ink/10" />
                  <div className="mt-4 flex h-16 items-end gap-1.5">
                    {[35, 60, 45, 80, 55, 90].map((height, bar) => (
                      <div
                        key={bar}
                        style={{ height: `${height}%` }}
                        className="w-full rounded-sm bg-brand-500/70"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {CHIPS.map((chip, index) => (
            <motion.div
              key={chip.label}
              className={`absolute ${chip.className} hidden items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium shadow-card sm:flex`}
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: floatDuration(index), repeat: Infinity, ease: "easeInOut" }
              }
            >
              <chip.icon className="h-4 w-4 text-brand-600" />
              {chip.label}
            </motion.div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Sparkles className="h-3.5 w-3.5" />
          [TRUST NOTE PLACEHOLDER — no statistics or testimonials until approved.]
        </p>
      </div>
    </section>
  );
}
