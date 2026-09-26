"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SESSION_KEY = "concierge_session";
const DISMISSED_KEY = "concierge_prompt_dismissed";
const PROMPT_DELAY_MS = 8_000;
const PULSE_MS = 45_000;
const MESSAGE_MAX = 500;

const GREETING =
  "Hi 👋 I'm the Winlerr assistant. Ask me about our systems, the free website offer, or how to get started.";

const FALLBACK =
  "I'm having trouble right now. Chat on WhatsApp → https://wa.me/260776950796";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface ConciergeResponse {
  ok?: boolean;
  reply?: string;
  session_id?: string;
  fallback?: string;
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Storage unavailable: the prompt just re-offers next visit.
  }
}

function readSession(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY) ?? "";
    if (/^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
    const fresh = window.crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return window.crypto.randomUUID();
  }
}

/**
 * Floating landing-page concierge.
 *
 * Placement note: `VoiceNote` already owns `fixed bottom-4 right-4 z-40`
 * (bottom ≈ 94px at its tallest), and we must not move it. This widget sits at
 * `bottom-32` so the two never overlap, and the open panel is anchored to the
 * same offset so the voice note stays reachable while chatting.
 *
 * The label bubble is always in the DOM (opacity-0 until the 8s timer) so the
 * server HTML contains it; it is removed after hydration only when the visitor
 * has dismissed it before.
 */
export function AiConcierge() {
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [pulse, setPulse] = React.useState(false);

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [waiting, setWaiting] = React.useState(false);

  const sessionRef = React.useRef("");
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const wasOpen = React.useRef(false);

  // Panel takes focus on open and hands it back to the trigger on close. The
  // trigger stays mounted the whole time (it simply paints behind the panel),
  // so it can always receive focus again.
  React.useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  // Session id is created once per browser and reused for rate limiting.
  React.useEffect(() => {
    sessionRef.current = readSession();
  }, []);

  // Label bubble: dismiss takes effect immediately, otherwise slides in at 8s.
  React.useEffect(() => {
    if (readDismissed()) {
      setDismissed(true);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Gentle pulse every 45s. Suppressed entirely under prefers-reduced-motion.
  React.useEffect(() => {
    if (reduceMotion) return;
    let inner = 0;
    const interval = window.setInterval(() => {
      setPulse(true);
      inner = window.setTimeout(() => setPulse(false), 1000);
    }, PULSE_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(inner);
    };
  }, [reduceMotion]);

  // Escape closes the panel.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Greeting is added the first time the panel opens.
  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", text: GREETING }]);
    }
  }, [open, messages.length]);

  // Keep the newest message in view.
  React.useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, waiting]);

  function dismissPrompt() {
    writeDismissed();
    setDismissed(true);
  }

  function toggle() {
    setOpen((value) => !value);
  }

  async function onSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || waiting) return;

    setWaiting(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionRef.current }),
      });
      const data = (await res.json().catch(() => null)) as ConciergeResponse | null;

      if (res.ok && data?.ok && data.reply) {
        if (data.session_id) sessionRef.current = data.session_id;
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply as string }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data?.fallback ?? FALLBACK },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: FALLBACK }]);
    } finally {
      setWaiting(false);
    }
  }

  const showPrompt = !dismissed;

  return (
    <>
      <div className="fixed bottom-32 right-4 z-40 flex items-end gap-3">
        {showPrompt && (
          <div
            aria-hidden={!shown}
            className={cn(
              "flex max-w-[min(17rem,calc(100vw-6rem))] translate-x-3 items-center gap-1 rounded-card border border-border bg-surface py-2 pl-3 pr-1 opacity-0 shadow-card transition-all duration-500 ease-out motion-reduce:transition-none",
              shown && "translate-x-0 opacity-100",
            )}
          >
            <p className="min-w-0 text-sm text-ink">Any questions? Text me anytime 👋</p>
            <button
              type="button"
              onClick={dismissPrompt}
              aria-label="Dismiss suggestion"
              tabIndex={shown ? 0 : -1}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-card text-ink-muted transition-colors hover:bg-surface-tint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <motion.button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label={open ? "Close Winlerr Assistant" : "Open Winlerr Assistant"}
          aria-expanded={open}
          animate={pulse && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-card transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <MessageCircle aria-hidden="true" className="h-6 w-6" />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="concierge-panel"
            role="dialog"
            aria-label="Winlerr Assistant"
            className={cn(
              "fixed inset-0 z-40 flex flex-col overflow-hidden border border-border bg-surface shadow-card",
              "sm:inset-auto sm:bottom-32 sm:right-4 sm:h-[520px] sm:w-[380px] sm:rounded-card",
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="font-display text-sm font-semibold text-ink">
                  Winlerr Assistant
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-9 w-9 items-center justify-center rounded-card border border-border text-ink transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={scrollRef}
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <p
                    className={cn(
                      "max-w-[85%] rounded-card px-3.5 py-2.5 text-sm",
                      message.role === "user"
                        ? "rounded-tr-sm bg-brand-600 text-white"
                        : "rounded-tl-sm bg-surface-tint text-ink",
                    )}
                  >
                    {message.text}
                  </p>
                </div>
              ))}

              {waiting && (
                <div className="flex justify-start">
                  <p className="rounded-card rounded-tl-sm bg-surface-tint px-3.5 py-2.5 text-sm text-ink-muted">
                    <span aria-label="Winlerr is typing" className="flex items-center gap-1 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" />
                    </span>
                  </p>
                </div>
              )}
            </div>

            <form
              onSubmit={onSend}
              className="flex items-center gap-2 border-t border-border px-3 py-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={waiting}
                maxLength={MESSAGE_MAX}
                placeholder="Ask a question…"
                aria-label="Message the Winlerr assistant"
                className="h-11 min-w-0 flex-1 rounded-card border border-border bg-surface px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={waiting || input.trim().length === 0}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-brand-600 text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50"
              >
                <Send aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
