const PRINCIPLES = [
  {
    title: "Clear first responses",
    note: "Set expectations for how new enquiries are acknowledged.",
  },
  {
    title: "Useful hand-offs",
    note: "Keep a person involved when a conversation needs judgement.",
  },
  {
    title: "Visible next steps",
    note: "Make follow-ups and customer commitments easier to track.",
  },
  {
    title: "A fit for your business",
    note: "Shape requirements and integrations around your workflow.",
  },
];

export function Outcomes() {
  return (
    <section aria-label="Outcomes" className="bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Designed for clear customer operations.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-muted">
          Explore the workflow goals behind the Winlerr catalogue, then confirm product fit and
          availability with us.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map(item => (
            <div
              key={item.title}
              className="rounded-card border border-border bg-surface p-6 shadow-card"
            >
              <p className="font-display text-xl font-bold">{item.title}</p>
              <p className="mt-2 text-sm text-ink-muted">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
