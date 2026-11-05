import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import { SiteNav } from "@/components/site-nav";
import { PRODUCT_CATALOGUE, PRODUCT_CATEGORIES } from "@/data/product-catalogue";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore Winlerr websites, business automation systems, AI agents, and WinlerrOS. Ask about current availability and product fit.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />
      <section className="px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs uppercase tracking-wide text-brand-600">Products</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            A clearer way to build your business systems.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted">
            Explore the website, customer workflow, and WinlerrOS concepts in the Winlerr catalogue.
            Product availability and pricing are confirmed with you before any commitment.
          </p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Product categories">
            {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
              <a
                key={key}
                href={`#${key}`}
                className="rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-tint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 pb-20 sm:px-6">
        {Object.entries(PRODUCT_CATEGORIES).map(([category, label]) => {
          const products = PRODUCT_CATALOGUE.filter(product =>
            product.category.includes(category as keyof typeof PRODUCT_CATEGORIES)
          );
          if (products.length === 0) return null;

          return (
            <section key={category} id={category} className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                    Catalogue
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {label}
                  </h2>
                </div>
                <span className="text-sm text-ink-muted">
                  {products.length} offering{products.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {products.map(product => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="group flex h-full flex-col rounded-card border border-border bg-surface p-6 shadow-card transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-brand-600">
                        {product.category.map(item => PRODUCT_CATEGORIES[item]).join(" · ")}
                      </span>
                      <span className="rounded-pill border border-border px-2.5 py-1 text-xs text-ink-muted">
                        {product.availability}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                      {product.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                      {product.shortDescription}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                      Explore product{" "}
                      <ArrowRight
                        aria-hidden="true"
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        <section className="rounded-card border border-border bg-surface-tint p-8 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Next step</p>
          <h2 className="mt-3 max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Tell us what your business needs to handle better.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            We can discuss product fit, current availability, requirements, and pricing for your
            situation.
          </p>
          <Link
            href="/get-started"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-pill bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Request a consultation <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </section>
      </div>
      <Footer />
    </main>
  );
}
