import Link from "next/link";

import type { RitualSuccessConfig } from "@/lib/registrar-flow";
import { recoveryTimeZone } from "@/lib/recovery-date";
import type { RehabSession, SessionType } from "@/types/recovery";

const sessionTypeLabels: Record<SessionType, string> = {
  PHYSIOTHERAPY: "Fisio guiada",
  HOME: "En casa",
  HYDROTHERAPY: "Hidroterapia",
  GYM: "Gimnasio",
  WALK: "Caminata",
  OTHER: "Otra",
};

function formatSessionContext(value?: string) {
  if (!value) return "Sesion registrada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sesion registrada";

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: recoveryTimeZone,
    weekday: "long",
  }).format(date);
}

interface SessionSavedStateProps extends RitualSuccessConfig {
  hasCloseoutToday: boolean;
  session?: RehabSession;
  streak: number;
}

export function SessionSavedState({
  body,
  hasCloseoutToday,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  session,
  streak,
}: SessionSavedStateProps) {
  const dayProgress = hasCloseoutToday ? 2 : 1;
  const ringOffset = hasCloseoutToday ? 0 : 188.5;
  const visibleStreak = Math.max(1, streak);
  const filledDots = Math.min(7, visibleStreak);

  return (
    <section className="rr-session-saved">
      <div aria-hidden="true" className="rr-success-glow" />
      <div className="rr-success-content">
        <p className="rr-success-context">{formatSessionContext(session?.occurredAt)}</p>

        <div className="rr-success-ring" role="img" aria-label={`${dayProgress} de 2 rituales completados`}>
          <svg aria-hidden="true" viewBox="0 0 136 136">
            <circle className="rr-success-ring-track" cx="68" cy="68" r="60" />
            <circle
              className="rr-success-ring-value"
              cx="68"
              cy="68"
              r="60"
              style={{ "--rr-ring-offset": ringOffset } as React.CSSProperties}
            />
          </svg>
          <div>
            <strong aria-hidden="true">✓</strong>
            <span>{dayProgress} de 2</span>
          </div>
        </div>

        <h1>Sesion hecha.</h1>
        <p className="rr-success-summary">{body}</p>

        <section className="rr-success-stats" aria-label="Resumen de la sesion">
          <div>
            <strong>{session ? sessionTypeLabels[session.sessionType] : "—"}</strong>
            <span>Tipo</span>
          </div>
          <div>
            <strong>{session?.exercises.length ?? 0}</strong>
            <span>Ejercicios</span>
          </div>
          <div>
            <strong>{session ? `${session.painBefore} → ${session.painAfter}` : "—"}</strong>
            <span>Dolor</span>
          </div>
        </section>

        <section className="rr-success-momentum">
          <div aria-hidden="true" className="rr-streak-dots">
            {Array.from({ length: 7 }, (_, index) => {
              const filled = index >= 7 - filledDots;
              return (
                <span
                  className={`${filled ? "is-filled" : ""} ${index === 6 ? "is-today" : ""}`}
                  key={index}
                />
              );
            })}
          </div>
          <p>
            <strong>{visibleStreak} dia{visibleStreak === 1 ? "" : "s"} seguido{visibleStreak === 1 ? "" : "s"}</strong>
            {" — tu registro de hoy ya cuenta."}
          </p>
        </section>

        <div className="rr-success-actions">
          <p>
            <span aria-hidden="true" className="rr-moon-chip">☾</span>
            <span>
              {hasCloseoutToday ? (
                <>Tu dia ya esta completo. <strong>Los dos rituales quedaron registrados.</strong></>
              ) : (
                <>Queda el cierre del dia — <strong>1 minuto, esta noche.</strong> Puedes hacerlo cuando termine tu dia.</>
              )}
            </span>
          </p>
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
