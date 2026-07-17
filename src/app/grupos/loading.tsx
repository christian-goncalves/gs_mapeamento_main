export default function LoadingGruposPage() {
  return (
    <main className="admin-layout" aria-busy="true" aria-label="Carregando painel administrativo">
      <aside className="admin-sidebar" aria-hidden="true">
        <div className="admin-brand">
          <span className="skeleton-block skeleton-icon" />
          <span className="skeleton-block skeleton-brand" />
        </div>
        <div className="admin-nav">
          {Array.from({ length: 5 }).map((_, index) => (
            <span className="skeleton-block skeleton-nav-item" key={index} />
          ))}
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-page-header">
          <div className="loading-title-stack">
            <span className="skeleton-block skeleton-eyebrow" />
            <span className="skeleton-block skeleton-title" />
          </div>
          <span className="skeleton-block skeleton-action" />
        </div>
        <section className="summary-cards" aria-label="Carregando resumo">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="summary-card" key={index}>
              <span className="skeleton-block skeleton-icon" />
              <div className="loading-title-stack">
                <span className="skeleton-block skeleton-line" />
                <span className="skeleton-block skeleton-number" />
              </div>
            </div>
          ))}
        </section>
        <section className="card admin-groups-card loading-groups-card" aria-label="Carregando grupos">
          <span className="skeleton-block skeleton-tabs" />
          <span className="skeleton-block skeleton-search" />
          {Array.from({ length: 3 }).map((_, index) => (
            <span className="skeleton-block skeleton-group-row" key={index} />
          ))}
        </section>
      </div>
    </main>
  );
}
