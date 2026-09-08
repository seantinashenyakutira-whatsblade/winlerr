export default function LoginPage() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="container">
          <nav className="nav" aria-label="Login navigation">
            <a className="brand" href="/"><span className="brand-mark">W/</span> winlerr</a>
            <div className="nav-links"><a href="/">Back to site</a><a className="nav-cta" href="/request">Request a system ↗</a></div>
          </nav>
          <div className="form-shell">
            <span className="eyebrow">WinlaOS / Client access</span>
            <h1>Your operating layer starts here.</h1>
            <p className="hero-copy">Public production authentication is intentionally not enabled until the launch environment and domain are approved. The foundation is verified in staging; this page keeps the boundary honest.</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="form-card login-card">
            <span className="tag">Launch status · staging verified</span>
            <h2>Access is being prepared for client rollout.</h2>
            <p>Already working with Winlerr? Contact us and we will provision your organization through the controlled onboarding path. For the product walkthrough, open the preview workspace.</p>
            <div className="actions"><a className="button-primary" href="mailto:hello@winlerr.vip?subject=WinlaOS%20client%20access">Request access →</a><a className="button-secondary dark" href="/portal">Open preview workspace</a></div>
          </div>
        </div>
      </section>
    </main>
  );
}
