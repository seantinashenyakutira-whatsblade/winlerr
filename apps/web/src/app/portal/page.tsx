const navItems = ["Overview", "My systems", "Requests", "Settings"];

export default function PortalPage() {
  return (
    <main className="portal">
      <div className="portal-layout">
        <aside className="sidebar">
          <a className="brand" href="/"><span className="brand-mark">W/</span> winlerr</a>
          <nav className="sidebar-nav" aria-label="Client portal navigation">
            {navItems.map((item, index) => <a className={index === 0 ? "active" : ""} href={index === 0 ? "/portal" : "/portal#" + item.toLowerCase().replace(" ", "-")} key={item}>{item}<span aria-hidden="true">{index === 0 ? "•" : "→"}</span></a>)}
            <a href="/request">Request a system <span aria-hidden="true">↗</span></a>
          </nav>
          <div className="sidebar-footer">WinlaOS is the client operating layer for your Winlerr systems.<br /><br />Need help? <a href="mailto:hello@winlerr.vip">hello@winlerr.vip</a></div>
        </aside>

        <section className="portal-main">
          <div className="portal-top">
            <div><span className="eyebrow">WinlaOS / Overview</span><h1>Good morning, your work has a home.</h1><p>Northstar Studio · workspace preview</p></div>
            <span className="portal-user">Demo workspace · Preview</span>
          </div>

          <div className="metric-grid">
            <div className="metric"><small>Active systems</small><strong>0</strong></div>
            <div className="metric"><small>Open requests</small><strong>0</strong></div>
            <div className="metric"><small>Organization</small><strong>NS</strong></div>
          </div>

          <div className="portal-card" id="requests">
            <h2>Requests</h2>
            <div className="empty-state"><span>Your implementation requests will appear here with clear ownership and status.</span><a className="button-primary" href="/request">Start a request</a></div>
          </div>

          <div className="portal-card" id="my-systems" style={{ marginTop: 16 }}>
            <h2>Available systems</h2>
            <div className="empty-state"><span>Lead Response is the first system entering the MVP path. Other systems will become available as they are validated.</span><a className="button-secondary dark" href="/#systems">Browse catalogue</a></div>
          </div>
        </section>
      </div>
    </main>
  );
}
