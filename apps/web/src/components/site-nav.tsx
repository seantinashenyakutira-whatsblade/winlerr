"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "How it works", href: "#how" },
  { label: "Systems", href: "#systems" },
  { label: "Contact", href: "#get-started" },
  { label: "About", href: "#about" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled ? "bg-surface/80 shadow-card backdrop-blur-md" : "bg-transparent",
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-card bg-ink font-mono text-sm text-white">
            W/
          </span>
          winlerr
        </a>

        <div className="hidden items-center gap-1 rounded-pill border border-border bg-surface/70 px-2 py-1.5 backdrop-blur-md md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-pill px-4 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-tint hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button href="#get-started" variant="dark" size="sm" className="rounded-pill">
            Get started
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-card border border-border md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col gap-1 bg-surface p-4 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-card px-4 py-3 text-lg font-medium hover:bg-surface-tint"
            >
              {link.label}
            </a>
          ))}
          <Button href="#get-started" variant="dark" size="lg" className="mt-4" onClick={() => setOpen(false)}>
            Get started
          </Button>
        </div>
      )}
    </header>
  );
}
