import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { ARTICLES } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Winlerr documentation: what Winlerr is, what the free website includes, how the six systems fit together, and answers to common questions.",
  alternates: { canonical: "/docs" },
};

export default function DocsIndexPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-4 pt-28 sm:px-6 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Docs</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          How Winlerr works.
        </h1>
        <p className="mt-4 text-base text-ink-muted">
          Start with what Winlerr is, then the free website, then the systems that sit on top of it.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <ul className="grid gap-4">
          {ARTICLES.map((article) => (
            <li key={article.slug}>
              <a
                href={`/docs/${article.slug}`}
                className="block rounded-card border border-border bg-surface p-6 shadow-card transition-colors hover:bg-surface-tint"
              >
                <h2 className="font-display text-lg font-bold">{article.title}</h2>
                <p className="mt-2 text-sm text-ink-muted">{article.description}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="rounded-card border border-border bg-surface-tint p-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">Still have a question?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink-muted">
            Ask us directly. We would rather answer it now than have you guess.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/get-started" size="lg">
              Get started
            </Button>
            <Button href="/systems" variant="secondary" size="lg">
              See the systems
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
