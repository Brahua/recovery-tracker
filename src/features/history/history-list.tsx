import Link from "next/link";

import {
  getHistoryDaySummary,
  type HistoryDay,
} from "@/lib/history-view-model";
import { recoveryTimeZone } from "@/lib/recovery-date";
import type {
  FinalState,
  ReboundLevel,
  SessionType,
} from "@/types/recovery";

const sessionTypeLabels: Record<SessionType, string> = {
  HOME: "En casa",
  PHYSIOTHERAPY: "Fisioterapia",
  HYDROTHERAPY: "Hidroterapia",
  GYM: "Gimnasio",
  WALK: "Caminata",
  OTHER: "Otra",
};

const finalStateLabels: Record<FinalState, string> = {
  BETTER: "Mejor",
  SAME: "Igual",
  WORSE: "Peor",
};

const reboundLabels: Record<ReboundLevel, string> = {
  NONE: "Sin rebote",
  MILD: "Leve",
  MODERATE: "Moderado",
  STRONG: "Fuerte",
};

const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  weekday: "long",
  year: "numeric",
  timeZone: recoveryTimeZone,
});

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: recoveryTimeZone,
});

function formatDay(date: string) {
  return dayFormatter.format(new Date(`${date}T12:00:00.000Z`));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface HistoryListProps {
  days: HistoryDay[];
  from: string;
  to: string;
  previousTo: string;
}

export function HistoryList({ days, from, to, previousTo }: HistoryListProps) {
  return (
    <section className="rr-history">
      <header className="rr-history-header">
        <div>
          <p className="rr-kicker">Registro personal</p>
          <h1 className="rr-display">Historial</h1>
          <p>Revisa tus sesiones y cierres anteriores sin modificar lo registrado.</p>
        </div>
        <span>{from} — {to}</span>
      </header>

      {days.length === 0 ? (
        <section className="rr-card rr-history-empty">
          <strong>No hay actividad en este periodo</strong>
          <p>Cuando registres una sesion o un cierre del dia, aparecera aqui.</p>
        </section>
      ) : (
        <div className="rr-history-days">
          {days.map((day) => (
            <article className="rr-history-day" key={day.date}>
              <header>
                <div>
                  <p className="rr-kicker">{day.date}</p>
                  <h2>{capitalize(formatDay(day.date))}</h2>
                </div>
                <span>{getHistoryDaySummary(day)}</span>
              </header>

              <div className="rr-history-events">
                {day.sessions.map((session, sessionIndex) => (
                  <details className="rr-card rr-history-event" key={session.id} open={sessionIndex === 0}>
                    <summary>
                      <span className="rr-history-event-mark">SE</span>
                      <span>
                        <strong>{sessionTypeLabels[session.sessionType]}</strong>
                        <small>{timeFormatter.format(new Date(session.occurredAt))} · dolor {session.painBefore} → {session.painAfter}</small>
                      </span>
                      <span className="rr-history-state">{finalStateLabels[session.finalState]}</span>
                    </summary>

                    <div className="rr-history-event-body">
                      <dl className="rr-history-metrics">
                        <div><dt>Dolor durante</dt><dd>{session.painDuring ?? "—"}/10</dd></div>
                        <div><dt>Esfuerzo</dt><dd>{session.perceivedLoad}/5</dd></div>
                        <div><dt>Estado final</dt><dd>{finalStateLabels[session.finalState]}</dd></div>
                      </dl>

                      <div className="rr-history-exercises">
                        <h3>Ejercicios</h3>
                        {session.exercises.length === 0 ? <p>Sin ejercicios detallados.</p> : session.exercises.map((exercise, exerciseIndex) => (
                          <section key={`${session.id}-${exercise.name}-${exerciseIndex}`}>
                            <div className="rr-history-exercise-title">
                              <strong>{exercise.name}</strong>
                              <span>
                                {exercise.durationMinutes ? `${exercise.durationMinutes} min` : ""}
                                {exercise.durationMinutes && exercise.distanceKm ? " · " : ""}
                                {exercise.distanceKm ? `${exercise.distanceKm} km` : ""}
                              </span>
                            </div>

                            {exercise.sets.length > 0 && (
                              <ol className="rr-history-sets">
                                {exercise.sets.map((set) => (
                                  <li key={set.position}>
                                    <span>Serie {set.position + 1}</span>
                                    <strong>{set.reps !== undefined ? `${set.reps} rep` : "—"}</strong>
                                    <strong>{set.weightKg !== undefined ? `${set.weightKg} kg` : "—"}</strong>
                                    {set.notes && <small>{set.notes}</small>}
                                  </li>
                                ))}
                              </ol>
                            )}

                            {exercise.legacyPrescription && (
                              <p className="rr-history-legacy">
                                Registro anterior: {exercise.legacyPrescription.setCount ?? "—"} series · {exercise.legacyPrescription.reps ?? "—"} rep · {exercise.legacyPrescription.weightKg ?? "—"} kg
                              </p>
                            )}
                            {exercise.notes && <p className="rr-history-note">{exercise.notes}</p>}
                          </section>
                        ))}
                      </div>

                      {session.notes && <p className="rr-history-note"><strong>Nota:</strong> {session.notes}</p>}
                    </div>
                  </details>
                ))}

                {day.closeout && (
                  <details className="rr-card rr-history-event rr-history-event--closeout" open={day.sessions.length === 0}>
                    <summary>
                      <span className="rr-history-event-mark">CD</span>
                      <span>
                        <strong>Cierre del dia</strong>
                        <small>Dolor final {day.closeout.endOfDayPain}/10 · {reboundLabels[day.closeout.reboundPainLevel]}</small>
                      </span>
                      <span className="rr-history-state">Guardado</span>
                    </summary>
                    <div className="rr-history-event-body">
                      <dl className="rr-history-metrics">
                        <div><dt>Energia</dt><dd>{day.closeout.energy}/5</dd></div>
                        <div><dt>Sueño</dt><dd>{day.closeout.sleepHours} h</dd></div>
                        <div><dt>Calidad</dt><dd>{day.closeout.sleepQuality}/5</dd></div>
                        <div><dt>Rebote</dt><dd>{reboundLabels[day.closeout.reboundPainLevel]}</dd></div>
                      </dl>
                      {day.closeout.notes && <p className="rr-history-note"><strong>Nota:</strong> {day.closeout.notes}</p>}
                    </div>
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Link className="rr-button rr-button--secondary rr-history-more" href={`/historial?before=${previousTo}`}>
        Ver 30 dias anteriores
      </Link>
    </section>
  );
}
