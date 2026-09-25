import { Clock, FileMinus2, Users, Zap } from "lucide-react";

const ITEMS = [
  {
    icon: Users,
    title: "More leads",
    description: "Every enquiry captured — calls, forms, WhatsApp, DMs.",
  },
  {
    icon: Zap,
    title: "Faster replies",
    description: "First response in seconds, not hours.",
  },
  {
    icon: FileMinus2,
    title: "Less admin",
    description: "Follow-ups, reminders, and records — handled automatically.",
  },
  {
    icon: Clock,
    title: "Always on",
    description: "Nights, weekends, holidays. Your business never sleeps.",
  },
];

export function ValueStrip() {
  return (
    <section aria-label="Key benefits" className="border-y border-border bg-surface-tint">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-brand-600/10">
              <item.icon className="h-5 w-5 text-brand-600" />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
