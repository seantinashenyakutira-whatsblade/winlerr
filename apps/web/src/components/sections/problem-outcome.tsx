"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, MessagesSquare, Trophy, UserPlus } from "lucide-react";

const CARDS = [
  { icon: UserPlus, title: "New leads", note: "New requests" },
  { icon: MessagesSquare, title: "Conversations", note: "Active chats" },
  { icon: CalendarClock, title: "Follow-ups due", note: "Due today" },
  { icon: Trophy, title: "Won", note: "Recently won" },
];

export function ProblemOutcome() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="From problem to outcome" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Stop losing customers to slow replies —{" "}
            <span className="text-brand-600">every enquiry answered</span>.
          </h2>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            Missed calls, forgotten follow-ups, and messages lost in WhatsApp — that&apos;s revenue
            walking out the door. Winlerr closes the gap. Every enquiry is captured, answered, and
            followed up — automatically, around the clock.
          </p>
        </div>
        <div className="relative space-y-3">
          {CARDS.map((card, index) => (
            <motion.div
              key={card.title}
              className="rounded-card border border-border bg-surface p-4 shadow-card"
              style={{ marginLeft: `${(index % 2) * 24}px` }}
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={reduceMotion ? undefined : { duration: 0.4, delay: index * 0.12 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-card bg-surface-tint">
                  <card.icon className="h-4 w-4 text-brand-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="font-mono text-xs text-ink-muted">{card.note}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
