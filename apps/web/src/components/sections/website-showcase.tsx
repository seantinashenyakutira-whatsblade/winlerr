import { Clock, MessageCircle } from "lucide-react";

const TILES = ["Wedding catering", "Corporate lunches", "Event planning"];

export function WebsiteShowcase() {
  return (
    <section aria-label="Free website showcase" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
        A free professional website for every Winlerr business.
      </h2>
      <div className="mx-auto mt-10 max-w-3xl rounded-card border border-border bg-surface shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
          <span className="ml-2 flex-1 rounded-pill bg-surface-tint px-4 py-1 text-center font-mono text-xs text-ink-muted">
            clientbusiness.winlerr.vip
          </span>
        </div>
        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-surface-tint font-mono text-xs text-ink-muted">
            logo
          </div>
          <p className="mt-3 font-display text-xl font-bold">Mwansa Catering</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {TILES.map((tile) => (
              <div key={tile} className="rounded-card border border-border bg-surface-tint p-4 text-sm text-ink-muted">
                {tile}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand-600 px-6 py-2.5 text-sm font-medium text-white">
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Clock className="h-4 w-4" /> Mon–Sat · 8am–6pm
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
