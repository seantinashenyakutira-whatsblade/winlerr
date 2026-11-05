import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Footer } from "@/components/sections/footer";
import { SiteNav } from "@/components/site-nav";
import {
  PRODUCT_CATALOGUE,
  PRODUCT_CATEGORIES,
  getProduct,
  getRelatedProducts,
} from "@/data/product-catalogue";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PRODUCT_CATALOGUE.map(product => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Products" };

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} — Winlerr`,
      description: product.shortDescription,
      type: "website",
    },
  };
}

function ContentList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map(item => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
            <span aria-hidden="true" className="mt-0.5 text-brand-600">
              →
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const relatedProducts = getRelatedProducts(product);

  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />
      <section className="px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowLeft aria-hidden="true" size={15} /> All products
          </Link>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {product.category.map(category => (
              <span
                key={category}
                className="rounded-pill border border-border px-3 py-1 text-xs text-ink-muted"
              >
                {PRODUCT_CATEGORIES[category]}
              </span>
            ))}
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {product.shortDescription}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-card border border-border bg-surface-tint px-4 py-3 text-sm">
            <span className="font-semibold">Availability</span>
            <span className="text-ink-muted">{product.availability}</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-ink-muted">
            We will confirm current availability, scope, and pricing with you before you decide.
          </p>
          {product.pricing && (
            <p className="mt-2 text-sm font-medium">Pricing: {product.pricing}</p>
          )}
          <Link
            href={product.cta.href}
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-pill bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {product.cta.label} <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.8fr)]">
        <div className="space-y-10">
          <section className="rounded-card border border-border bg-surface-tint p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight">The customer problem</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{product.customerProblem}</p>
          </section>
          <ContentList title="Features" items={product.features} />
          <section>
            <h2 className="font-display text-xl font-bold tracking-tight">Typical workflow</h2>
            <ol className="mt-4 space-y-4">
              {product.workflow.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-brand-600/10 font-mono text-xs font-semibold text-brand-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </section>
          <ContentList title="Potential benefits" items={product.benefits} />
        </div>
        <aside className="space-y-8">
          <ContentList title="Requirements to discuss" items={product.requirements} />
          <ContentList title="Integrations" items={product.integrations} />
          {relatedProducts.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold tracking-tight">Related products</h2>
              <div className="mt-4 space-y-3">
                {relatedProducts.map(related => (
                  <Link
                    key={related.slug}
                    href={`/products/${related.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{related.name}</span>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {related.shortDescription}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      size={15}
                      className="shrink-0 text-brand-600 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
      <Footer />
    </main>
  );
}
