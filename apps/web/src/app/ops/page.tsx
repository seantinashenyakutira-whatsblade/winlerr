const requests = [
  { company: "Northstar Studio", product: "Lead Response", status: "Scoping", owner: "Winlerr / pending" },
  { company: "Koru Fitness", product: "Booking System", status: "Submitted", owner: "Unassigned" },
  { company: "Maya & Co.", product: "Website System", status: "Needs review", owner: "Unassigned" },
];

export default function OperationsPage() {
  return (
    <main className="portal">
      <div className="portal-layout">
        <aside className="sidebar">
          <a className="brand" href="/"><span className="brand-mark">W/</span> winlerr</a>
          <nav className="sidebar-nav" aria-label="Operations navigation">
            <a className="active" href="/ops">Requests <span aria-hidden="true">•</span></a>
            <a href="/lead-response">Lead Response <span aria-hidden="true">↗</span></a>
            <a href="/portal">Client preview <span aria-hidden="true">↗</span></a>
          </nav>
          <div className="sidebar-footer">Internal preview only.<br />Production authorization, persistence, and role enforcement are not enabled for this route yet.</div>
        </aside>
        <section className="portal-main">
          <div className="portal-top"><div><span className="eyebrow">Winlerr / Operations preview</span><h1>Know what is moving.</h1><p>Incoming requests, product context, and the next implementation step in one place.</p></div><span className="portal-user">Auth gate pending</span></div>
          <div className="metric-grid"><div className="metric"><small>Open requests</small><strong>{requests.length}</strong></div><div className="metric"><small>In scoping</small><strong>1</strong></div><div className="metric"><small>Unassigned</small><strong>2</strong></div></div>
          <div className="portal-card" style={{ marginTop: 16 }}><h2>Incoming product requests</h2><div className="ops-list">{requests.map((request) => <div className="ops-row" key={`${request.company}-${request.product}`}><div><strong>{request.company}</strong><small>{request.product}</small></div><div><b>{request.status}</b><small>{request.owner}</small></div></div>)}</div></div>
          <div className="notice" style={{ marginTop: 16 }}>This surface is a UI contract for the future authenticated operations route. It does not yet read or write production data.</div>
        </section>
      </div>
    </main>
  );
}
