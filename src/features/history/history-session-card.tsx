import {
  finalStateLabels,
  formatHistoryNumber,
  historyTimeFormatter,
  sessionTypeGlyphs,
  sessionTypeLabels,
} from "@/features/history/history-formatters";
import type { RehabSession } from "@/types/recovery";

interface HistorySessionCardProps {
  expanded: boolean;
  onToggle: () => void;
  session: RehabSession;
}

function stateClass(session: RehabSession) {
  if (session.finalState === "BETTER") return "is-better";
  if (session.finalState === "WORSE") return "is-worse";
  return "is-same";
}

export function HistorySessionCard({
  expanded,
  onToggle,
  session,
}: HistorySessionCardProps) {
  const detailId = `history-session-${session.id}`;

  return (
    <article
      className={`rr-history-event ${expanded ? "is-expanded" : ""}`}
      data-session-id={session.id}
    >
      <button
        aria-controls={detailId}
        aria-expanded={expanded}
        className="rr-history-event-toggle"
        onClick={onToggle}
        type="button"
      >
        <span aria-hidden="true" className="rr-history-event-mark">
          {sessionTypeGlyphs[session.sessionType]}
        </span>
        <span className="rr-history-event-title">
          <strong>
            {sessionTypeLabels[session.sessionType]} · {historyTimeFormatter.format(new Date(session.occurredAt))}
          </strong>
          <small>Dolor {session.painBefore} → {session.painAfter}</small>
        </span>
        <span className={`rr-history-state ${stateClass(session)}`}>
          {finalStateLabels[session.finalState]}
        </span>
        <span aria-hidden="true" className="rr-history-chevron">⌄</span>
      </button>

      {expanded && (
        <div className="rr-history-event-body" id={detailId}>
          <dl className="rr-history-metrics">
            <div>
              <dt>Dolor</dt>
              <dd>{session.painBefore} · {session.painDuring ?? "—"} · {session.painAfter}</dd>
            </div>
            <div>
              <dt>Esfuerzo</dt>
              <dd>{session.perceivedLoad}<small>/5</small></dd>
            </div>
            <div>
              <dt>Al terminar</dt>
              <dd className={stateClass(session)}>{finalStateLabels[session.finalState]}</dd>
            </div>
          </dl>

          <div className="rr-history-exercises">
            {session.exercises.length === 0 ? (
              <p>Sin ejercicios detallados.</p>
            ) : session.exercises.map((exercise, exerciseIndex) => (
              <section key={`${session.id}-${exercise.name}-${exerciseIndex}`}>
                <div className="rr-history-exercise-title">
                  <strong>{exercise.name}</strong>
                  {(exercise.durationMinutes || exercise.distanceKm) && (
                    <span>
                      {exercise.durationMinutes ? `${formatHistoryNumber(exercise.durationMinutes)} min` : ""}
                      {exercise.durationMinutes && exercise.distanceKm ? " · " : ""}
                      {exercise.distanceKm ? `${formatHistoryNumber(exercise.distanceKm)} km` : ""}
                    </span>
                  )}
                </div>

                {exercise.sets.length > 0 && (
                  <ol className="rr-history-sets">
                    {exercise.sets.map((set) => (
                      <li key={set.position}>
                        <span>
                          Serie {set.position + 1}
                          {set.reps !== undefined ? ` · ${set.reps} rep` : ""}
                          {set.weightKg !== undefined ? ` · ${formatHistoryNumber(set.weightKg)} kg` : ""}
                        </span>
                        {set.notes && <small>{set.notes}</small>}
                      </li>
                    ))}
                  </ol>
                )}

                {exercise.notes && <p className="rr-history-note">{exercise.notes}</p>}
                {exercise.legacyPrescription && (
                  <div className="rr-history-legacy">
                    <span>Registro anterior</span>
                    <p>
                      {exercise.legacyPrescription.setCount ?? "—"} series · {exercise.legacyPrescription.reps ?? "—"} rep · {exercise.legacyPrescription.weightKg ?? "—"} kg
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>

          {session.notes && (
            <p className="rr-history-session-note">
              <strong>Nota</strong>
              <span>{session.notes}</span>
            </p>
          )}
        </div>
      )}
    </article>
  );
}
