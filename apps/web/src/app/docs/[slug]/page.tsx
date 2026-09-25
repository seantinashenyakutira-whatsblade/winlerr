import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { ARTICLES, getArticle } from "@/lib/docs";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Docs" };
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/docs/${article.slug}` },
  };
}

export default async function DocsArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const others = ARTICLES.filter((entry) => entry.slug !== article.slug);

  return (
    <main className="min-h-screen bg-surface text-ink">
      <SiteNav />

      <article className="mx-auto max-w-3xl px-4 pt-28 sm:px-6 sm:pt-32">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Docs</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-base text-ink-muted">{article.intro}</p>

        <div className="mt-10 space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-bold">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-ink-muted">
                      <span aria-hidden="true" className="text-brand-600">
                        &rarr;
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-card border border-border bg-surface-tint p-8 text-center">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Ready to get your free website?
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/get-started" size="lg">
              Get started
            </Button>
            <Button href="/docs" variant="secondary" size="lg">
              All docs
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="font-mono text-xs uppercase tracking-wide text-ink-muted">Keep reading</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {others.map((entry) => (
            <li key={entry.slug}>
              <a
                href={`/docs/${entry.slug}`}
                className="block rounded-card border border-border bg-surface p-4 text-sm font-medium shadow-card transition-colors hover:bg-surface-tint"
              >
                {entry.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
