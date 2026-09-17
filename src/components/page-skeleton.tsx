export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="rr-skeleton-page" role="status">
      <span className="rr-skeleton rr-skeleton--eyebrow" />
      <span className="rr-skeleton rr-skeleton--title" />
      <span className="rr-skeleton rr-skeleton--hero" />
      <div className="rr-skeleton-grid">
        <span className="rr-skeleton rr-skeleton--card" />
        <span className="rr-skeleton rr-skeleton--card" />
      </div>
    </div>
  );
}
