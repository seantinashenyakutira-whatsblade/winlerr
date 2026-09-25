import { cn } from "@/lib/utils";

const STATS = [
  {
    value: "Reply in <60s",
    note: "Target response SLA — what the system is built to hit.",
    accent: true,
    span: "sm:col-span-2",
  },
  { value: "24/7 coverage", note: "Nights, weekends, holidays.", accent: false, span: "" },
  { value: "Hours saved weekly", note: "Time back for selling.", accent: false, span: "" },
  { value: "More qualified leads", note: "Scored before you call.", accent: false, span: "" },
];

export function Outcomes() {
  return (
    <section aria-label="Outcomes" className="bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          What running on Winlerr looks like.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-muted">
          Targets and value propositions — not customer claims. Figures to be replaced with measured results.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.value}
              className={cn(
                "rounded-card border p-6 shadow-card",
                stat.span,
                stat.accent ? "border-transparent bg-accent-500 text-white" : "border-border bg-surface",
              )}
            >
              <p className="font-display text-2xl font-bold sm:text-3xl">{stat.value}</p>
              <p className={cn("mt-2 text-sm", stat.accent ? "text-white/80" : "text-ink-muted")}>{stat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
