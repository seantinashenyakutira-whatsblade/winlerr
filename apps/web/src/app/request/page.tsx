"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function RequestPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const company = String(form.get("company") ?? "");
    const email = String(form.get("email") ?? "");
    const product = String(form.get("product") ?? "");
    const brief = String(form.get("brief") ?? "");
    const subject = `Winlerr system enquiry — ${product || "new request"}`;
    const body = `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nSystem: ${product}\n\nWhat should move better:\n${brief}`;
    window.location.href = `mailto:hello@winlerr.vip?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  return (
    <main className="site-shell">
      <section className="hero">
        <div className="container">
          <nav className="nav" aria-label="Request navigation">
            <a className="brand" href="/"><span className="brand-mark">W/</span> winlerr</a>
            <div className="nav-links"><a href="/">Back to site</a><a className="nav-cta" href="/portal">Client portal</a></div>
          </nav>
          <div className="form-shell">
            <span className="eyebrow">Start with the friction</span>
            <h1>Tell us what should move better.</h1>
            <p className="hero-copy">Share a little context. We will use it to shape a useful first conversation, not send you into a generic sales funnel.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required placeholder="Aisha Khan" /></div>
              <div className="field"><label htmlFor="company">Company</label><input id="company" name="company" required placeholder="Northstar Studio" /></div>
              <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" required placeholder="you@company.com" /></div>
              <div className="field"><label htmlFor="product">System of interest</label><select id="product" name="product" defaultValue="Lead Response"><option>Lead Response</option><option>CRM Lite</option><option>Booking System</option><option>Social Agent</option><option>Website System</option><option>Not sure yet</option></select></div>
              <div className="field full"><label htmlFor="brief">What should move better?</label><textarea id="brief" name="brief" required placeholder="For example: enquiries arrive through three channels and follow-up gets lost after the first reply." /></div>
            </div>
            {submitted && <div className="notice" role="status">Your email draft is ready. Send it to complete the request; if your mail app did not open, write to <a href="mailto:hello@winlerr.vip">hello@winlerr.vip</a>.</div>}
            <button className="button-primary" type="submit">Prepare my request <span aria-hidden="true">→</span></button>
          </form>
        </div>
      </section>
    </main>
  );
}
