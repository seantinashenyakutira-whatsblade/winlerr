"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gift, Loader2, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/260776950796";
const BUSINESS_NAME_MAX = 80;

type Status = "idle" | "loading" | "success" | "error";

interface ClaimResponse {
  ok?: boolean;
  slug?: string;
  error?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Line-art gift box that sits on top of the tag. White fill + brand outline so
 * it reads on both the light hero background and the blue button it overlaps.
 */
function GiftBox({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 40"
      aria-hidden="true"
      focusable="false"
      className={cn("fill-white stroke-brand-600", className)}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path d="M6 14h32v4H6z" />
      <path d="M9 18h26v17a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" />
      <path d="M22 14v23" className="stroke-brand-600" />
      <path d="M22 14c-4 0-9-1.5-9-5.5S17 4 22 14z" />
      <path d="M22 14c4 0 9-1.5 9-5.5S27 4 22 14z" />
    </svg>
  );
}

/**
 * Hero primary CTA: a gift-box tag that opens the claim modal.
 *
 * Idle animation is a 3px bounce on a 1.8s loop, switched off entirely under
 * `prefers-reduced-motion`.
 */
export function ClaimGift() {
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const firstFieldRef = React.useRef<HTMLInputElement | null>(null);
  const successRef = React.useRef<HTMLAnchorElement | null>(null);

  const [businessName, setBusinessName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const slug = slugify(businessName);

  function openModal() {
    setStatus("idle");
    setErrorMessage("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    // Focus returns to the element that opened the dialog.
    triggerRef.current?.focus();
  }

  // Escape closes; background scroll locks while the dialog is up.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Initial focus: first field on open, the WhatsApp link on success.
  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      if (status === "success") successRef.current?.focus();
      else firstFieldRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, status]);

  // Focus trap: Tab and Shift+Tab cycle inside the panel only.
  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName.trim(),
          email: email.trim(),
          ...(whatsapp.trim() ? { whatsapp: whatsapp.trim() } : {}),
        }),
      });

      const data = (await res.json().catch(() => null)) as ClaimResponse | null;

      if (res.ok && data?.ok) {
        setStatus("success");
        return;
      }

      setErrorMessage(data?.error || "We couldn't place that claim. Please try again.");
      setStatus("error");
    } catch {
      setErrorMessage("We couldn't place that claim. Please try again.");
      setStatus("error");
    }
  }

  const busy = status === "loading";
  const success = status === "success";

  return (
    <>
      <motion.div
        className="relative inline-flex"
        animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
        transition={reduceMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* The box sits on top of the tag; the tag carries the label. */}
        <GiftBox className="pointer-events-none absolute -top-6 left-1/2 h-8 w-9 -translate-x-1/2" />
        <button
          ref={triggerRef}
          type="button"
          onClick={openModal}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "relative")}
        >
          <Gift aria-hidden="true" className="h-5 w-5" />
          Claim gift
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          // The outer motion element owns the exit: AnimatePresence only waits
          // on its direct child, so the whole overlay fades out together.
          <motion.div
            key="claim-gift-dialog"
            className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-6"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              aria-hidden="true"
              onClick={closeModal}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="claim-gift-title"
              onKeyDown={trapFocus}
              className={cn(
                "relative flex h-full w-full flex-col overflow-hidden border border-border bg-surface shadow-card",
                "sm:h-auto sm:max-h-[calc(100vh-3rem)] sm:w-full sm:max-w-lg sm:rounded-card",
              )}
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                <div>
                  <h2 id="claim-gift-title" className="font-display text-xl font-bold text-ink">
                    You&apos;ve got a free website 🎁
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Hosted free on yourbusiness.winlerr.vip. No upfront cost.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card border border-border text-ink transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                {success ? (
                  <div className="space-y-5">
                    <p className="text-base leading-relaxed text-ink" role="status">
                      Got it, {businessName.trim()}. Check {email.trim()} for next steps. We&apos;ll
                      reach out on WhatsApp within 24 hours.
                    </p>
                    <a
                      ref={successRef}
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="claim-business">Business name</Label>
                      <Input
                        ref={firstFieldRef}
                        id="claim-business"
                        name="business_name"
                        autoComplete="organization"
                        maxLength={BUSINESS_NAME_MAX}
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        disabled={busy}
                        required
                        placeholder="e.g. Miso Restaurant"
                        className="mt-1"
                      />
                      <p className="mt-2 font-mono text-xs text-ink-muted" aria-live="polite">
                        {slug ? (
                          <>
                            <span className="text-brand-600">{slug}</span>.winlerr.vip
                          </>
                        ) : (
                          "yourbusiness.winlerr.vip"
                        )}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="claim-email">Email</Label>
                      <Input
                        id="claim-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={busy}
                        required
                        placeholder="you@business.co.zm"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="claim-whatsapp">
                        WhatsApp{" "}
                        <span className="font-normal text-ink-muted">(optional)</span>
                      </Label>
                      <Input
                        id="claim-whatsapp"
                        name="whatsapp"
                        type="tel"
                        autoComplete="tel"
                        value={whatsapp}
                        onChange={(event) => setWhatsapp(event.target.value)}
                        disabled={busy}
                        placeholder="+260 97 000 0000"
                        className="mt-1"
                      />
                    </div>

                    {status === "error" && (
                      <p role="alert" className="text-sm text-accent-500">
                        {errorMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={busy || !slug || !email.trim()}
                      className={cn(
                        buttonVariants({ variant: "primary", size: "lg" }),
                        "w-full disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      {busy ? (
                        <>
                          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                          Claiming…
                        </>
                      ) : (
                        "Claim my free website"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
