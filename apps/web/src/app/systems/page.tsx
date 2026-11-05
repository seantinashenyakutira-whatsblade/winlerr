import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { PRODUCT_CATALOGUE, PRODUCT_CATEGORIES } from "@/data/product-catalogue";

export const metadata: Metadata = {
  title: "Business systems",
  description:
    "Explore Winlerr business automation systems and AI agents for customer enquiries, appointments, and follow-up.",
  alternates: { canonical: "/systems" },
};

const SYSTEMS = PRODUCT_CATALOGUE.filter(product =>
  product.category.some(category => category === "business-automation" || category === "ai-agents")
);

export default function SystemsPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />
      <section className="px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs uppercase tracking-wide text-brand-600">
            Business systems
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Practical systems for everyday customer work.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted">
            Explore the Winlerr systems catalogue for customer enquiries, appointments, and
            follow-up. We confirm current availability, requirements, and fit with you.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-ink-muted">
            Product details and pricing are shared after we understand your business needs.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          {SYSTEMS.map(system => (
            <Link
              key={system.slug}
              href={`/products/${system.slug}`}
              className="block rounded-card border border-border bg-surface p-6 shadow-card transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wide text-brand-600">
                  {system.category.map(category => PRODUCT_CATEGORIES[category]).join(" · ")}
                </span>
                <span className="rounded-pill border border-border px-2.5 py-1 text-xs text-ink-muted">
                  {system.availability}
                </span>
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{system.name}</h2>
              <p className="mt-2 text-sm font-medium text-brand-600">{system.shortDescription}</p>
              <p className="mt-3 text-sm text-ink-muted">{system.customerProblem}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-card border border-border bg-surface-tint p-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Not sure which system fits?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted">
            Tell us how your business handles enquiries and follow-up today. We can discuss product
            fit and current availability.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/get-started" size="lg">
              Request a consultation
            </Button>
            <Button href="/products" variant="secondary" size="lg">
              Browse all products
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
