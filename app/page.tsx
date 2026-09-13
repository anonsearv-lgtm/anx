export default function Home() {
  return <div id="app">
    <aside className="sidebar" id="sidebar">
      <div className="brand"><div className="brand-mark">A</div><div><div className="brand-name">ANONYMOUX</div><div className="brand-sub">STUDIO</div></div></div>
      <nav id="nav" className="nav"></nav>
      <div className="sidebar-footer"><button className="ghost" id="themeToggle" title="Toggle ambient glow">◉ Ambient</button><div className="tiny">Postgres • Blob • Decart</div></div>
    </aside>
    <div className="mobile-backdrop" id="mobileBackdrop"></div>
    <main className="main">
      <header className="topbar"><button className="icon-btn" id="menuBtn" aria-label="Open menu">☰</button><div><div className="eyebrow" id="eyebrow">STUDIO</div><h1 id="pageTitle">Dashboard</h1></div><div className="top-actions"><button className="icon-btn" id="notifBtn" aria-label="Notifications">🔔<span className="badge hidden" id="notifBadge">0</span></button></div></header>
      <section id="view" className="view"></section>
    </main>
    <div id="toastStack" className="toast-stack"></div>
    <div className="modal hidden" id="notifModal"><div className="modal-card"><div className="modal-head"><h3>Notifications</h3><button className="icon-btn" data-close="notifModal">✕</button></div><div id="notifList" className="list"></div></div></div>
  </div>;
}
