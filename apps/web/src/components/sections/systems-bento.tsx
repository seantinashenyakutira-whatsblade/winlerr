import { AtSign, BellRing, Bot, CalendarCheck, MessageCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SYSTEMS = [
  {
    icon: Zap,
    title: "Lead Response",
    description: "[PLACEHOLDER] Every enquiry triaged and answered in seconds.",
    featured: true,
    span: "sm:col-span-2",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp AI Agent",
    description: "[PLACEHOLDER] Customer conversations on autopilot.",
    featured: false,
    span: "",
  },
  {
    icon: AtSign,
    title: "Social DM Agent",
    description: "[PLACEHOLDER] Facebook and Instagram messages handled.",
    featured: false,
    span: "",
  },
  {
    icon: CalendarCheck,
    title: "Booking System",
    description: "[PLACEHOLDER] Appointments without the back-and-forth.",
    featured: false,
    span: "",
  },
  {
    icon: BellRing,
    title: "Customer Follow-up",
    description: "[PLACEHOLDER] Quotes chased and reviews requested.",
    featured: false,
    span: "",
  },
  {
    icon: Bot,
    title: "AI Receptionist",
    description: "[PLACEHOLDER] A front desk that never sleeps.",
    featured: false,
    span: "sm:col-span-2",
  },
];

export function SystemsBento() {
  return (
    <section id="systems" aria-label="Winlerr systems" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
        [SYSTEMS HEADLINE PLACEHOLDER]
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-muted">
        [SYSTEMS INTRO PLACEHOLDER — start with one system, connect more over time.]
      </p>
      <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 -z-10 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl"
        />
        {SYSTEMS.map((system) => (
          <div
            key={system.title}
            className={cn(
              "rounded-card border p-6 transition-transform hover:-translate-y-1",
              system.span,
              system.featured
                ? "border-transparent bg-ink text-white shadow-card"
                : "border-border bg-surface text-ink shadow-card",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-card",
                system.featured ? "bg-white/10" : "bg-brand-600/10",
              )}
            >
              <system.icon className={cn("h-5 w-5", system.featured ? "text-white" : "text-brand-600")} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">{system.title}</h3>
            <p className={cn("mt-1 text-sm", system.featured ? "text-white/70" : "text-ink-muted")}>
              {system.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
