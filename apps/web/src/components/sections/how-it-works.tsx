import { Globe, Handshake, MessageCircle, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Globe,
    title: "1) Get your free website",
    description: "[PLACEHOLDER] A professional page for your business, live in days.",
    mock: "url-bar",
  },
  {
    icon: MessageCircle,
    title: "2) Connect WhatsApp & social",
    description: "[PLACEHOLDER] Link the channels your customers already use.",
    mock: "chat",
  },
  {
    icon: Sparkles,
    title: "3) AI responds & qualifies",
    description: "[PLACEHOLDER] Every enquiry answered and scored, around the clock.",
    mock: "score",
  },
  {
    icon: Handshake,
    title: "4) You close more deals",
    description: "[PLACEHOLDER] Spend time selling, not chasing.",
    mock: "won",
  },
];

function MiniMock({ kind }: { kind: string }) {
  if (kind === "url-bar") {
    return (
      <div className="mt-3 rounded-card border border-border bg-surface p-2">
        <div className="flex items-center gap-2 rounded-pill bg-surface-tint px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          <span className="font-mono text-[10px] text-ink-muted">yourbusiness.winlerr.vip</span>
        </div>
      </div>
    );
  }
  if (kind === "chat") {
    return (
      <div className="mt-3 space-y-1.5 rounded-card border border-border bg-surface p-2">
        <div className="h-4 w-3/4 rounded-pill bg-surface-tint" />
        <div className="ml-auto h-4 w-2/3 rounded-pill bg-brand-600/15" />
      </div>
    );
  }
  if (kind === "score") {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-card border border-border bg-surface p-2">
        <div className="h-2 flex-1 rounded-pill bg-surface-tint">
          <div className="h-2 w-4/5 rounded-pill bg-brand-500" />
        </div>
        <span className="font-mono text-[10px] text-ink-muted">82</span>
      </div>
    );
  }
  return (
    <div className="mt-3 flex items-center gap-2 rounded-card border border-border bg-surface p-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-brand-600/10 font-mono text-[10px] text-brand-600">
        ✓
      </span>
      <span className="font-mono text-[10px] text-ink-muted">deal moved to won</span>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" aria-label="How it works" className="bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          [HOW-IT-WORKS HEADLINE PLACEHOLDER]
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-card border border-border bg-surface p-6 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{step.description}</p>
              <MiniMock kind={step.mock} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
