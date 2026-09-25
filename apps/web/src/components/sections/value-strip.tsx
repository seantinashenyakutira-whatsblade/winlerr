import { Clock, FileMinus2, Users, Zap } from "lucide-react";

const ITEMS = [
  {
    icon: Users,
    title: "More leads",
    description: "[PLACEHOLDER] Every enquiry captured in one place.",
  },
  {
    icon: Zap,
    title: "Faster replies",
    description: "[PLACEHOLDER] First response in seconds, not hours.",
  },
  {
    icon: FileMinus2,
    title: "Less admin",
    description: "[PLACEHOLDER] Follow-ups handled without spreadsheets.",
  },
  {
    icon: Clock,
    title: "Always on",
    description: "[PLACEHOLDER] Nights, weekends, and holidays covered.",
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
