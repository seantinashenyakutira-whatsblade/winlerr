"use client";

import { useMemo, useState } from "react";

type Lead = { name: string; source: string; status: string; intent: string; last: string };

const initialLeads: Lead[] = [
  { name: "Maya & Co.", source: "Website form", status: "Needs reply", intent: "Website System", last: "8 min ago" },
  { name: "Jordan Ellis", source: "Referral", status: "Qualified", intent: "Lead Response", last: "42 min ago" },
  { name: "Koru Fitness", source: "Manual entry", status: "Waiting", intent: "Booking System", last: "Yesterday" },
];

export default function LeadResponsePage() {
  const [leads, setLeads] = useState(initialLeads);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("Hi Maya — thanks for reaching out. I’ve got the context and will come back with a useful next step shortly.");
  const draftFor = (lead: Lead) => lead.name === "Maya & Co." ? "Hi Maya — thanks for reaching out. I’ve got the context and will come back with a useful next step shortly." : `Hi ${lead.name.split(" ")[0]} — thanks for the context. I’m reviewing the next step and will come back shortly.`;
  const [sent, setSent] = useState(false);
  const active = leads[selected];
  const queueCount = useMemo(() => leads.filter((lead) => lead.status === "Needs reply").length, [leads]);

  function markReplied() {
    setLeads((current) => current.map((lead, index) => index === selected ? { ...lead, status: "Replied", last: "Just now" } : lead));
    setSent(true);
  }

  return (
    <main className="portal">
      <div className="portal-layout">
        <aside className="sidebar">
          <a className="brand" href="/"><span className="brand-mark">W/</span> winlerr</a>
          <nav className="sidebar-nav" aria-label="Lead Response navigation">
            <a href="/portal">WinlaOS <span aria-hidden="true">↗</span></a>
            <a className="active" href="/lead-response">Lead Response <span aria-hidden="true">•</span></a>
            <a href="/lead-response#settings">Settings <span aria-hidden="true">→</span></a>
            <a href="/request?product=Lead%20Response">Request rollout <span aria-hidden="true">↗</span></a>
          </nav>
          <div className="sidebar-footer">Demo workspace<br />Northstar Studio<br /><br />This MVP uses local demo data. Provider channels and persistence are not enabled yet.</div>
        </aside>

        <section className="portal-main">
          <div className="portal-top">
            <div><span className="eyebrow">Lead Response / Demo</span><h1>Keep the next reply moving.</h1><p>Prioritise the queue, shape the response, and keep ownership visible.</p></div>
            <span className="portal-user">{queueCount} needs reply</span>
          </div>

          <div className="metric-grid">
            <div className="metric"><small>Open queue</small><strong>{leads.length}</strong></div>
            <div className="metric"><small>Needs reply</small><strong>{queueCount}</strong></div>
            <div className="metric"><small>Avg response</small><strong>—</strong></div>
          </div>

          <div className="portal-card" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}><h2>Lead queue</h2><span className="tag">Local demo data</span></div>
            <div className="lead-list">
              {leads.map((lead, index) => <button className={`lead-row ${selected === index ? "selected" : ""}`} key={lead.name} onClick={() => { setSelected(index); setMessage(draftFor(lead)); setSent(false); }}><span><strong>{lead.name}</strong><small>{lead.source} · {lead.last}</small></span><span><b>{lead.intent}</b><small>{lead.status}</small></span></button>)}
            </div>
          </div>

          <div className="portal-card" style={{ marginTop: 16 }}>
            <span className="eyebrow">Response workspace</span>
            <h2 style={{ marginTop: 12 }}>{active.name}</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Intent: {active.intent}. The MVP keeps a human in control of the reply; AI-assisted drafting and channel delivery will be added behind verified provider capabilities.</p>
            <textarea className="response-box" value={message} onChange={(event) => setMessage(event.target.value)} aria-label="Response draft" />
            {sent && <div className="notice" role="status">Demo reply marked as sent locally. No external message was delivered.</div>}
            <div className="actions"><button className="button-primary" onClick={markReplied}>Mark reply sent <span aria-hidden="true">→</span></button><a className="button-secondary dark" href="/request?product=Lead%20Response">Request implementation</a></div>
          </div>
        </section>
      </div>
    </main>
  );
}
