import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { SYSTEM_DETAILS, getSystem } from "@/lib/systems";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SYSTEM_DETAILS.map((system) => ({ slug: system.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const system = getSystem(slug);
  if (!system) return { title: "Systems" };
  return {
    title: system.name,
    description: system.tagline,
    alternates: { canonical: `/systems/${system.slug}` },
  };
}

export default async function SystemDetailPage({ params }: Params) {
  const { slug } = await params;
  const system = getSystem(slug);
  if (!system) notFound();

  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-4 pt-28 sm:px-6 sm:pt-32">
        <Link
          href="/systems"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          &larr; All systems
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-wide text-brand-600">System</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          {system.name}
        </h1>
        <p className="mt-4 font-display text-lg font-semibold text-brand-600">{system.tagline}</p>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">{system.hero}</p>
        <div className="mt-8">
          <Button href="/get-started" size="lg">
            Get started
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-xl font-bold tracking-tight">Who it&apos;s for</h2>
        <ul className="mt-4 space-y-2">
          {system.who.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink-muted">
              <span aria-hidden="true" className="text-brand-600">
                &rarr;
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h2 className="font-display text-xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-4 space-y-3">
          {system.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-brand-600 font-mono text-xs font-semibold text-white"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h2 className="font-display text-xl font-bold tracking-tight">What you get</h2>
        <ul className="mt-4 space-y-2">
          {system.get.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink-muted">
              <span aria-hidden="true" className="text-brand-600">
                &rarr;
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h2 className="font-display text-xl font-bold tracking-tight">Pairs well with</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {system.pairs.map((pair) => (
            <Link
              key={pair.slug}
              href={`/systems/${pair.slug}`}
              className="block rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:bg-surface-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="block text-sm font-semibold text-ink">{pair.name}</span>
              <span className="mt-1 block text-sm text-ink-muted">{pair.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-card border border-border bg-surface-tint p-8 text-center">
          <h2 className="font-display text-xl font-bold tracking-tight">{system.cta}</h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/get-started" size="lg">
              Get started
            </Button>
            <Button href="/systems" variant="secondary" size="lg">
              All systems
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
