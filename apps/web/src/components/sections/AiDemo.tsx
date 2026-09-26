"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BUSINESS_TYPES = ["Restaurant", "Salon", "Contractor", "Retail", "Other"] as const;

const PREFILL = "Hi, do you deliver to Kabulonga and how much for 20 people?";
const ENQUIRY_MAX = 300;

const OUTCOMES = ["Lead qualified", "Follow-up scheduled", "Owner notified"] as const;

type Mode = "live" | "canned";
type Status = "idle" | "loading" | "done" | "error";

interface DemoResponse {
  ok: boolean;
  mode?: Mode;
  reply?: string;
  latencyMs?: number;
  error?: string;
}

export function AiDemo() {
  const reduceMotion = useReducedMotion();

  const [businessType, setBusinessType] = React.useState<string>(BUSINESS_TYPES[0]);
  const [enquiry, setEnquiry] = React.useState(PREFILL);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [showTyping, setShowTyping] = React.useState(false);
  const [showOutcomes, setShowOutcomes] = React.useState(false);

  // Reset the reveal timers whenever a new reply replaces the old one.
  React.useEffect(() => {
    if (status !== "done") {
      setShowTyping(false);
      setShowOutcomes(false);
      return;
    }
    if (reduceMotion) {
      setShowTyping(false);
      setShowOutcomes(true);
      return;
    }
    setShowTyping(true);
    const typingTimer = window.setTimeout(() => setShowTyping(false), 1200);
    const outcomeTimer = window.setTimeout(() => setShowOutcomes(true), 1500);
    return () => {
      window.clearTimeout(typingTimer);
      window.clearTimeout(outcomeTimer);
    };
  }, [status, reduceMotion]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");
    setReply("");
    setMode(null);
    setShowTyping(false);
    setShowOutcomes(false);

    try {
      const res = await fetch("/api/demo-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType, enquiry: enquiry.trim() }),
      });

      const data = (await res.json().catch(() => null)) as DemoResponse | null;

      if (res.status === 429) {
        setErrorMessage("You've used the demo a few times already. Try again in an hour.");
        setStatus("error");
        return;
      }
      if (!res.ok || !data?.ok || !data.reply) {
        setErrorMessage("We couldn't reach the demo right now. Try again in a moment.");
        setStatus("error");
        return;
      }

      setMode(data.mode ?? "canned");
      setReply(data.reply);
      setStatus("done");
    } catch {
      setErrorMessage("We couldn't reach the demo right now. Try again in a moment.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMessage("");
    setReply("");
    setMode(null);
    setShowTyping(false);
    setShowOutcomes(false);
  }

  const busy = status === "loading";
  const showConversation = status === "done" || status === "loading";
  const stagger = reduceMotion ? 0 : 0.12;

  return (
    <section id="demo" aria-label="See the AI reply for yourself" className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            See it work. Right now.
          </h2>
          <p className="mt-3 text-ink-muted">
            Pick a business type and send a real enquiry. Winlerr replies in seconds — the same engine
            that would run your WhatsApp.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl">
          {mode === "canned" && (
            <span className="absolute -top-3 right-2 z-10 rounded-pill border border-border bg-surface-tint px-3 py-1 text-xs font-medium text-ink-muted sm:right-4">
              Demo mode
            </span>
          )}

          <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="demo-business-type">Business type</Label>
                <select
                  id="demo-business-type"
                  name="businessType"
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  disabled={busy}
                  className="mt-1 h-11 w-full rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink transition-colors outline-none focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="demo-enquiry">Your enquiry</Label>
                <div className="relative">
                  <Textarea
                    id="demo-enquiry"
                    name="enquiry"
                    rows={3}
                    maxLength={ENQUIRY_MAX}
                    value={enquiry}
                    onChange={(event) => setEnquiry(event.target.value)}
                    disabled={busy}
                    className="pb-8"
                    placeholder="Ask a question a real customer would ask…"
                  />
                  <span className="pointer-events-none absolute bottom-2.5 right-3 font-mono text-xs text-ink-muted">
                    {enquiry.length}/{ENQUIRY_MAX}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  size="lg"
                  disabled={busy || enquiry.trim().length === 0}
                  className="w-full bg-brand-600 hover:bg-brand-500 sm:w-auto"
                >
                  {busy ? (
                    <>
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      Replying…
                    </>
                  ) : (
                    <>
                      <Send aria-hidden="true" className="h-4 w-4" />
                      See Winlerr reply
                    </>
                  )}
                </Button>

                {status !== "idle" && !busy && (
                  <Button type="button" variant="secondary" size="lg" onClick={reset} className="w-full sm:w-auto">
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    Try another enquiry
                  </Button>
                )}
              </div>

              {status === "error" && (
                <p role="alert" className="text-sm text-accent-500">
                  {errorMessage}
                </p>
              )}
            </form>

            <div aria-live="polite" className="mt-6 space-y-3">
              <AnimatePresence initial={false}>
                {showConversation && (
                  <motion.div
                    key="customer"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <p className="max-w-[85%] rounded-card rounded-tl-sm bg-surface-tint px-4 py-3 text-sm text-ink">
                      {enquiry.trim()}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {showConversation && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: stagger }}
                  className="flex justify-end"
                >
                  <p className="max-w-[85%] rounded-card rounded-tr-sm bg-brand-600 px-4 py-3 text-sm text-white">
                    {showTyping ? (
                      <span aria-label="Winlerr is typing" className="flex items-center gap-1 py-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
                      </span>
                    ) : (
                      reply
                    )}
                  </p>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {showOutcomes && (
                  <motion.ul
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-ink-muted"
                  >
                    {OUTCOMES.map((outcome) => (
                      <li key={outcome} className="flex items-center gap-1.5">
                        <Check aria-hidden="true" className="h-3.5 w-3.5 text-brand-600" />
                        {outcome}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
