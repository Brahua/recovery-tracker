import Link from "@/components/app-link";

import { SaveSessionAsRoutine } from "@/features/routines/save-session-as-routine";
import type { RitualSuccessConfig } from "@/lib/registrar-flow";
import { recoveryTimeZone } from "@/lib/recovery-date";
import { suggestRoutineName } from "@/lib/routine-state";
import type { DayProgress } from "@/lib/session-goal-progress";
import type { RehabSession, SessionType } from "@/types/recovery";

const sessionTypeLabels: Record<SessionType, string> = {
  PHYSIOTHERAPY: "Fisio guiada",
  HOME: "En casa",
  HYDROTHERAPY: "Hidroterapia",
  GYM: "Gimnasio",
  WALK: "Caminata",
  OTHER: "Otra",
  MOBILITY: "Movilidad",
  BALANCE: "Equilibrio",
  BREATHING: "Respiración",
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
  /** Today's sessions against the goal, the saved one included. */
  dayProgress: DayProgress;
  session?: RehabSession;
  streak: number;
}

export function SessionSavedState({
  body,
  dayProgress,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  session,
  streak,
}: SessionSavedStateProps) {
  const ringShare = Math.min(1, dayProgress.count / dayProgress.perDay);
  // 377 ≈ 2π·60, the ring's circumference.
  const ringOffset = Math.round(377 * (1 - ringShare) * 10) / 10;
  const visibleStreak = Math.max(1, streak);
  const filledDots = Math.min(7, visibleStreak);

  return (
    <section className="rr-session-saved">
      <div aria-hidden="true" className="rr-success-glow" />
      <div className="rr-success-content">
        <p className="rr-success-context">{formatSessionContext(session?.occurredAt)}</p>

        <div
          className="rr-success-ring"
          role="img"
          aria-label={`${dayProgress.count} de ${dayProgress.perDay} sesiones de hoy`}
        >
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
            <span>
              {dayProgress.count} de {dayProgress.perDay}
            </span>
          </div>
        </div>

        <h1>Sesion hecha.</h1>
        <p className="rr-success-summary">{body}</p>

        <section className="rr-success-stats" aria-label="Resumen de la sesion">
          <div>
            <strong>{session ? sessionTypeLabels[session.sessionType] : "—"}</strong>
            <span>Tipo</span>
          </div>
          {session && session.treatments.length > 0 ? (
            <div>
              <strong>
                {session.exercises.length} · {session.treatments.length}
              </strong>
              <span>Ejerc. · trat.</span>
            </div>
          ) : (
            <div>
              <strong>{session?.exercises.length ?? 0}</strong>
              <span>Ejercicios</span>
            </div>
          )}
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
            <strong>
              {visibleStreak} dia{visibleStreak === 1 ? "" : "s"} seguido
              {visibleStreak === 1 ? "" : "s"}
            </strong>
            {" — tu registro de hoy ya cuenta."}
          </p>
        </section>

        <div className="rr-success-actions">
          <p>
            <span aria-hidden="true" className="rr-moon-chip">
              ☾
            </span>
            <span>
              {dayProgress.met ? (
                <>
                  Tu día ya está completo. <strong>Llegaste a tu meta de sesiones.</strong>
                </>
              ) : (
                <>
                  Llevas {dayProgress.count} de {dayProgress.perDay} sesiones —{" "}
                  <strong>
                    {dayProgress.perDay - dayProgress.count === 1
                      ? "la siguiente completa el día."
                      : `te faltan ${dayProgress.perDay - dayProgress.count} para completar el día.`}
                  </strong>
                </>
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
          {session ? (
            <Link
              aria-label="Corregir la sesión"
              className="rr-success-secondary"
              href={`/registrar/sesion/${session.id}`}
            >
              Corregir
            </Link>
          ) : null}
          {session && session.exercises.length > 0 ? (
            <SaveSessionAsRoutine
              sessionId={session.id}
              suggestedName={suggestRoutineName(
                session.sessionType,
                session.occurredAt,
                recoveryTimeZone,
              )}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
