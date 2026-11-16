import Link from "@/components/app-link";

import type { RitualSuccessConfig } from "@/lib/registrar-flow";

// After "¿Cómo amaneciste?": a short confirmation and the way back to the day.
export function MorningSavedState({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: RitualSuccessConfig) {
  return (
    <section className="rr-session-saved">
      <div aria-hidden="true" className="rr-success-glow" />
      <div className="rr-success-content">
        <p className="rr-success-context">Registro de la mañana</p>
        <h1>{title}</h1>
        <p className="rr-success-summary">{body}</p>
        <div className="rr-success-actions">
          <Link className="rr-success-primary" href={primaryHref}>
            <span>{primaryLabel}</span>
            <b aria-hidden="true">→</b>
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link className="rr-success-secondary" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          ) : null}
          <Link className="rr-success-secondary" href="/historial">
            Ver historial
          </Link>
        </div>
      </div>
    </section>
  );
}
