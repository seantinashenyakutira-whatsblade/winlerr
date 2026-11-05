import Link from "next/link";
import { AtSign, BellRing, Bot, CalendarCheck, MessageCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_CATALOGUE } from "@/data/product-catalogue";

const ICONS = {
  "lead-response": Zap,
  "whatsapp-ai-agent": MessageCircle,
  "social-dm-agent": AtSign,
  "booking-system": CalendarCheck,
  "customer-follow-up": BellRing,
  "ai-receptionist": Bot,
} as const;

const SYSTEMS = PRODUCT_CATALOGUE.filter(product =>
  product.category.some(category => category === "business-automation" || category === "ai-agents")
).map((product, index) => ({
  ...product,
  icon: ICONS[product.slug as keyof typeof ICONS] ?? Bot,
  featured: index === 0,
  span: index === 0 || index === 5 ? "sm:col-span-2" : "",
}));

export function SystemsBento() {
  return (
    <section
      id="systems"
      aria-label="Winlerr systems"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Systems designed around the way customers find you.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-muted">
        Explore proposed workflows for enquiries, conversations, bookings, and follow-up. We confirm
        current availability with you.
      </p>
      <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 -z-10 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl"
        />
        {SYSTEMS.map(system => (
          <Link
            key={system.slug}
            href={`/products/${system.slug}`}
            className={cn(
              "rounded-card border p-6 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              system.span,
              system.featured
                ? "border-transparent bg-ink text-white shadow-card"
                : "border-border bg-surface text-ink shadow-card"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-card",
                system.featured ? "bg-white/10" : "bg-brand-600/10"
              )}
            >
              <system.icon
                className={cn("h-5 w-5", system.featured ? "text-white" : "text-brand-600")}
              />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">{system.name}</h3>
            <p className={cn("mt-1 text-sm", system.featured ? "text-white/70" : "text-ink-muted")}>
              {system.shortDescription}
            </p>
            <p className={cn("mt-3 text-xs", system.featured ? "text-white/60" : "text-ink-muted")}>
              {system.availability}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/products"
          className="inline-flex items-center rounded-pill border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Browse the product catalogue{" "}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
