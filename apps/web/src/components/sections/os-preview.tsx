export function OsPreview() {
  return (
    <section aria-label="Winlerr OS preview" className="bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Winlerr OS — your business, in one place.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">Leads, conversations, follow-ups, and reports — in a single dashboard that works on any device.</p>
        <div className="relative mx-auto mt-12 max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 h-72 w-[560px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-3xl"
          />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center">
            <div className="w-full max-w-xl rounded-card border border-border bg-surface p-4 text-left shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-2">
                  <div className="h-8 rounded-card bg-surface-tint" />
                  <div className="h-8 rounded-card bg-surface-tint" />
                  <div className="h-8 rounded-card bg-brand-600/15" />
                </div>
                <div className="col-span-2 rounded-card bg-surface-tint p-3">
                  <div className="mb-2 h-2.5 w-1/2 rounded-pill bg-ink/10" />
                  <div className="mb-2 h-2.5 w-full rounded-pill bg-ink/10" />
                  <div className="h-2.5 w-2/3 rounded-pill bg-ink/10" />
                </div>
              </div>
            </div>
            <div className="w-40 shrink-0 rounded-card border border-border bg-surface p-3 text-left shadow-card">
              <div className="mx-auto mb-2 h-1 w-12 rounded-pill bg-ink/10" />
              <div className="space-y-1.5">
                <div className="h-6 rounded-card bg-surface-tint" />
                <div className="ml-4 h-6 rounded-card bg-brand-600/15" />
                <div className="h-6 rounded-card bg-surface-tint" />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-8 text-sm text-ink-muted">Your business, in one place.</p>
      </div>
    </section>
  );
}
