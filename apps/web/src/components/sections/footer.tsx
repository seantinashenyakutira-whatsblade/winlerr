import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { VoiceNoteReplay } from "@/components/VoiceNote";
import { PRODUCT_CATALOGUE } from "@/data/product-catalogue";

const PRIMARY_PRODUCTS = [
  "free-professional-business-website",
  "lead-response",
  "whatsapp-ai-agent",
  "winlerros",
];

const PRODUCTS = PRIMARY_PRODUCTS.map(slug =>
  PRODUCT_CATALOGUE.find(product => product.slug === slug)
).filter(product => product !== undefined);

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Products", href: "/products" },
      { label: "Business systems", href: "/systems" },
      { label: "Documentation", href: "/docs" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Winlerr", href: "/about" },
      { label: "Contact", href: "/get-started" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-card bg-ink font-mono text-sm text-white">
                W/
              </span>
              winlerr
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              Business websites and connected systems, built for businesses in Zambia.
            </p>
            <div className="mt-4">
              <VoiceNoteReplay />
            </div>
            <p className="mt-2 font-mono text-xs text-ink-muted">winlerr.vip</p>
            <a
              href="https://wa.me/260776950796"
              aria-label="Contact Winlerr on WhatsApp"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-card border border-border bg-surface hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Products</h2>
            <ul className="mt-3 space-y-2">
              {PRODUCTS.map(product => (
                <li key={product.slug}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm text-ink-muted hover:text-ink"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {COLUMNS.map(column => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-ink-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-ink-muted sm:flex-row">
          <span>© {year} Winlerr. All rights reserved.</span>
          <span className="font-mono">Built in Zambia 🇿🇲</span>
        </div>
      </div>
    </footer>
  );
}
