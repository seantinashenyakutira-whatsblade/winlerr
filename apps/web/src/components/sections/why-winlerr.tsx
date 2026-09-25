import { MapPin, Package, Settings2 } from "lucide-react";

const ITEMS = [
  {
    icon: MapPin,
    title: "Built for Zambian SMEs",
    description:
      "WhatsApp-first, mobile-money-aware, and priced for growing businesses — not adapted from elsewhere.",
  },
  {
    icon: Package,
    title: "Productized systems, not custom dev",
    description:
      "Fixed-scope systems with clear timelines, instead of open-ended projects that never ship.",
  },
  {
    icon: Settings2,
    title: "Reusable and configurable",
    description:
      "Start with one system; configure and connect more as the business grows.",
  },
];

export function WhyWinlerr() {
  return (
    <section aria-label="Why Winlerr" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Why Zambian businesses choose Winlerr.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.title} className="rounded-card border border-border bg-surface p-6 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-500/10">
              <item.icon className="h-5 w-5 text-accent-500" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
