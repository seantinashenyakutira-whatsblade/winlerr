import { AtSign, Globe, MessageCircle, Send } from "lucide-react";

const COLUMNS = [
  { title: "Product", links: ["Lead Response", "WhatsApp AI", "Booking", "Follow-up"] },
  { title: "Systems", links: ["Social DM Agent", "AI Receptionist", "Winlerr OS", "Free website"] },
  { title: "Company", links: ["About", "How it works", "Pricing", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms"] },
];

const SOCIALS = [
  { icon: Globe, label: "Website", href: "#" },
  { icon: AtSign, label: "Social", href: "#" },
  { icon: Send, label: "Share", href: "#" },
  { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="about" className="border-t border-border bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-6">
          <div className="md:col-span-2">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-card bg-ink font-mono text-sm text-white">
                W/
              </span>
              winlerr
            </p>
            <p className="mt-3 text-sm text-ink-muted">[FOOTER TAGLINE PLACEHOLDER]</p>
            <p className="mt-2 font-mono text-xs text-ink-muted">winlerr.vip</p>
            <div className="mt-4 flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                  className="flex h-9 w-9 items-center justify-center rounded-card border border-border bg-surface hover:bg-surface"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-ink-muted hover:text-ink">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-ink-muted sm:flex-row">
          <span>© {year} Winlerr. All rights reserved.</span>
          <span className="font-mono">[FOOTER NOTE PLACEHOLDER]</span>
        </div>
      </div>
    </footer>
  );
}
