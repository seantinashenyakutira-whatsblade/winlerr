"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "loading" | "success" | "error";

export function LeadForm() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      business_name: String(data.get("business_name") ?? "").trim() || undefined,
      whatsapp: String(data.get("whatsapp") ?? "").trim() || undefined,
      email: String(data.get("email") ?? "").trim() || undefined,
      message: String(data.get("message") ?? "").trim() || undefined,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setErrorMessage("Unable to submit. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setErrorMessage("Unable to submit. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="get-started" aria-label="Get started" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          [FINAL CTA HEADLINE PLACEHOLDER]
        </h2>
        <p className="mt-3 text-ink-muted">[FINAL CTA COPY PLACEHOLDER — one line.]</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mx-auto mt-10 max-w-xl rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        {status === "success" ? (
          <p role="status" className="rounded-card bg-brand-600/10 p-4 text-center text-sm font-medium text-brand-600">
            Thanks — we&apos;ll be in touch.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lead-name">Your name *</Label>
              <Input id="lead-name" name="name" required autoComplete="name" placeholder="e.g. Chanda Mwansa" />
            </div>
            <div>
              <Label htmlFor="lead-business">Business name</Label>
              <Input
                id="lead-business"
                name="business_name"
                autoComplete="organization"
                placeholder="e.g. Mwansa Catering"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="lead-whatsapp">WhatsApp</Label>
                <Input id="lead-whatsapp" name="whatsapp" autoComplete="tel" placeholder="e.g. +260970000000" />
              </div>
              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input id="lead-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="lead-message">What do you need?</Label>
              <Textarea id="lead-message" name="message" rows={4} placeholder="Tell us about your business…" />
            </div>
            {status === "error" && (
              <p role="alert" className="text-sm text-accent-500">
                {errorMessage}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={status === "loading"}
              className="w-full bg-accent-500 hover:bg-accent-400 disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Get your free website"}
            </Button>
          </div>
        )}
      </form>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="#" className="text-sm font-medium text-ink-muted underline-offset-4 hover:underline">
          Book a demo
        </a>
        <span aria-hidden="true" className="hidden text-border sm:inline">
          |
        </span>
        <a
          href="https://wa.me/260776950796"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-pill border border-border px-5 py-2 text-sm font-medium hover:bg-surface-tint"
        >
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}
