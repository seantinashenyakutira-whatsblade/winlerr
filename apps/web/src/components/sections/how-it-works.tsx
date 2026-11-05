import { Globe, Handshake, MessageCircle, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Globe,
    title: "1) Share your business details",
    description: "Tell us what you do, who you serve, and how customers reach you.",
    mock: "url-bar",
  },
  {
    icon: MessageCircle,
    title: "2) Review your online presence",
    description: "Discuss a professional business page and the information customers need.",
    mock: "chat",
  },
  {
    icon: Sparkles,
    title: "3) Explore the right system",
    description:
      "Review possible workflows for enquiries, customer messages, bookings, or follow-up.",
    mock: "score",
  },
  {
    icon: Handshake,
    title: "4) Confirm scope and availability",
    description:
      "Agree on requirements, current product availability, and pricing before work begins.",
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
        <span className="font-mono text-[10px] text-ink-muted">Steps</span>
      </div>
    );
  }
  return (
    <div className="mt-3 flex items-center gap-2 rounded-card border border-border bg-surface p-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-brand-600/10 font-mono text-[10px] text-brand-600">
        ✓
      </span>
      <span className="font-mono text-[10px] text-ink-muted">Follow-up agreed</span>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" aria-label="How it works" className="bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          A considered path from first conversation to the right setup.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {STEPS.map(step => (
            <div
              key={step.title}
              className="rounded-card border border-border bg-surface p-6 shadow-card"
            >
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
