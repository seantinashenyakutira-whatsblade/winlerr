const products = [
  {
    code: "01 / RESPONSE",
    name: "Lead Response",
    description:
      "A focused lead operating system for teams that need every enquiry triaged, answered, and moved toward a next step.",
    status: "MVP in build",
    className: "featured",
  },
  {
    code: "02 / PIPELINE",
    name: "CRM Lite",
    description:
      "A clear, lightweight customer pipeline for teams that have outgrown spreadsheets but not their common sense.",
    status: "Planned",
    className: "",
  },
  {
    code: "03 / TIME",
    name: "Booking System",
    description:
      "A practical request and scheduling layer for service businesses that want fewer back-and-forth messages.",
    status: "Planned",
    className: "",
  },
  {
    code: "04 / SIGNAL",
    name: "Social Agent",
    description:
      "A structured foundation for channel-aware agents, with real provider capabilities added only when access is verified.",
    status: "Architecture ready",
    className: "wide",
  },
  {
    code: "05 / PRESENCE",
    name: "Website System",
    description:
      "A conversion-focused website layer designed to turn a cold introduction into a useful next conversation.",
    status: "Demonstrable",
    className: "wide",
  },
];

const steps = [
  ["01", "Tell us the friction", "We map the work that is costing your team time, leads, or confidence."],
  ["02", "Choose the system", "Start with a focused product or commission a tailored operating layer."],
  ["03", "Shape the rollout", "A clear implementation plan keeps scope, access, and ownership visible."],
  ["04", "Run with clarity", "Your team gets a system that is useful on day one and ready to extend."],
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <div className="container">
          <nav className="nav" aria-label="Primary navigation">
            <a className="brand" href="#top"><span className="brand-mark">W/</span> winlerr</a>
            <div className="nav-links">
              <a href="#systems">Systems</a>
              <a href="#how">How it works</a>
              <a href="/login">Client login</a>
              <a className="nav-cta" href="/request">Request a system <span aria-hidden="true">↗</span></a>
            </div>
          </nav>

          <div className="hero-grid">
            <div>
              <span className="eyebrow">Business systems / Built for movement</span>
              <h1>Less busywork.<br /><em>More forward.</em></h1>
              <p className="hero-copy">
                Winlerr builds focused software systems for teams that need work to move: faster lead response, clearer operations, and better client experiences without the enterprise theatre.
              </p>
              <div className="actions">
                <a className="button-primary" href="/request">Tell us what you need <span aria-hidden="true">→</span></a>
                <a className="button-secondary" href="#systems">Explore the systems</a>
              </div>
            </div>

            <div className="hero-card" aria-label="Winlerr operating loop">
              <div className="hero-card-top"><span>WINLERR / OPERATING LOOP</span><span className="live-dot">DESIGNED TO SHIP</span></div>
              <div className="flow-row"><span className="flow-icon">01</span><div><strong>Signal arrives</strong><span>Every lead, request, or handoff gets a visible place.</span></div></div>
              <div className="flow-row"><span className="flow-icon">02</span><div><strong>Work gets shaped</strong><span>Context, ownership, and the next step stay together.</span></div></div>
              <div className="flow-row"><span className="flow-icon">03</span><div><strong>Momentum compounds</strong><span>Your team spends less time searching and more time delivering.</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="systems">
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">The system catalogue</span><h2>Small systems.<br />Real leverage.</h2></div>
            <p className="section-intro">Five focused products for the moments where a business loses momentum. Start with one. Build a connected operating layer over time.</p>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article className={`product-card ${product.className}`} key={product.name}>
                <div className="product-kicker"><span>{product.code}</span><span className="tag">{product.status}</span></div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <a className="product-link" href={`/request?product=${encodeURIComponent(product.name)}`}>Request this system <span aria-hidden="true">↗</span></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container band-inner">
          <h2>Your next system should remove a bottleneck, not add another dashboard.</h2>
          <a className="button-secondary dark" href="mailto:hello@winlerr.vip?subject=Winlerr%20system%20enquiry">Talk to Winlerr <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">A practical rollout</span><h2>From friction<br />to flow.</h2></div>
            <p className="section-intro">No grand transformation programme. We start with a real workflow, make it visible, and ship the smallest useful version first.</p>
          </div>
          <div className="steps">
            {steps.map(([number, title, copy]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></div>)}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div><a className="brand" href="#top"><span className="brand-mark">W/</span> winlerr</a><p>Business systems for teams ready to move with more clarity.</p></div>
            <div><h3>Explore</h3><p><a href="#systems">Systems</a><br /><a href="#how">How it works</a><br /><a href="/login">Client login</a></p></div>
            <div><h3>Start a conversation</h3><p><a href="mailto:hello@winlerr.vip">hello@winlerr.vip</a><br />Built for practical momentum.</p></div>
          </div>
          <div className="footer-bottom"><span>© 2026 Winlerr. Systems that move work forward.</span><span>Public launch surface / v0.1</span></div>
        </div>
      </footer>
    </main>
  );
}
