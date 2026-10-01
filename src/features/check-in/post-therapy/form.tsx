"use client";

import Link from "@/components/app-link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { ExerciseEntryEditor } from "@/components/exercise-entry-editor";
import { FormPendingReporter } from "@/components/feedback/form-pending-reporter";
import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { RitualPainSlider } from "@/components/ritual-pain-slider";
import { useAppRouter } from "@/components/use-app-router";
import {
  createPostTherapySessionAction,
  deleteRehabSessionAction,
  updateRehabSessionAction,
} from "@/features/check-in/post-therapy/actions";
import { TreatmentsCard } from "@/features/check-in/post-therapy/treatments-card";
import { RoutinePicker } from "@/features/routines/routine-picker";
import { createDraftId } from "@/lib/draft-id";
import {
  findRepeatedEntryIds,
  isExerciseEntryComplete,
  toExercisePayload,
  type ExerciseEntryDraft,
} from "@/lib/exercise-entry-state";
import { getHistoryHrefForDate } from "@/lib/history-view-model";
import {
  addRecoveryDays,
  getRecoveryDateKey,
  recoveryTimeZone,
  toRecoveryDateTimeLocal,
} from "@/lib/recovery-date";
import {
  sessionToExerciseEntries,
  sessionToTreatmentDrafts,
} from "@/lib/session-edit-state";
import { getSessionFormProgress } from "@/lib/session-form-state";
import {
  countValidTreatments,
  formatTreatmentCount,
  toTreatmentPayload,
  type TreatmentDraft,
} from "@/lib/treatments";
import type {
  Exercise,
  FinalState,
  PainScore,
  Rating1To5,
  RehabSession,
  Routine,
  SessionType,
} from "@/types/recovery";

const sessionTypeOptions: Array<{ value: SessionType; label: string }> = [
  { value: "PHYSIOTHERAPY", label: "Fisio guiada" },
  { value: "HOME", label: "En casa" },
  { value: "GYM", label: "Gimnasio" },
  { value: "HYDROTHERAPY", label: "Hidroterapia" },
  { value: "WALK", label: "Caminata" },
  { value: "OTHER", label: "Otro" },
];

const loadOptions: Array<{ value: Rating1To5; label: string }> = [
  { value: 1, label: "Muy suave" },
  { value: 2, label: "Suave" },
  { value: 3, label: "Media" },
  { value: 4, label: "Alta" },
  { value: 5, label: "Muy alta" },
];

const finalStateOptions: Array<{ value: FinalState; label: string }> = [
  { value: "BETTER", label: "Mejor que antes" },
  { value: "SAME", label: "Igual" },
  { value: "WORSE", label: "Molesta" },
];

const contextDayFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: recoveryTimeZone,
  weekday: "short",
});

// "Hoy · 18:30", "Ayer · 18:30" or "lun, 29 sept · 18:30" for a datetime-local value in Lima time.
function formatContextDate(value: string, today: string) {
  const day = value.slice(0, 10);
  const time = value.slice(11, 16) || "--:--";

  if (day === today) return `Hoy · ${time}`;
  if (day === addRecoveryDays(today, -1)) return `Ayer · ${time}`;

  const date = new Date(`${day}T12:00:00-05:00`);
  return Number.isNaN(date.getTime()) ? time : `${contextDayFormatter.format(date)} · ${time}`;
}

function formatSessionDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Reciente";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const key = date.toDateString();

  if (key === today.toDateString()) return "Hoy";
  if (key === yesterday.toDateString()) return "Ayer";

  return new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(date);
}

function sessionTypeLabel(value: SessionType) {
  return sessionTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function SectionHeader({
  complete,
  title,
  trailing,
}: {
  complete: boolean;
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="rr-form-section-heading">
      <span aria-hidden="true" className={`rr-step-badge ${complete ? "is-complete" : ""}`}>
        {complete ? "✓" : ""}
      </span>
      <h2>{title}</h2>
      {trailing ? <div>{trailing}</div> : null}
    </div>
  );
}

function SaveButton({
  exerciseCount,
  isComplete,
  isEditing,
  missingSteps,
  treatmentCount,
}: {
  exerciseCount: number;
  isComplete: boolean;
  isEditing: boolean;
  missingSteps: number;
  treatmentCount: number;
}) {
  const { pending } = useFormStatus();
  const exerciseLabel = `${exerciseCount} ejercicio${exerciseCount === 1 ? "" : "s"}`;
  const readyLabel =
    treatmentCount > 0 ? `${exerciseLabel} · ${formatTreatmentCount(treatmentCount)}` : exerciseLabel;

  return (
    <button
      className={`rr-session-save ${isComplete ? "is-ready" : ""}`}
      disabled={!isComplete || pending}
      type="submit"
    >
      <span>{pending ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar sesion"}</span>
      <span>
        <small>{isComplete ? readyLabel : `faltan ${missingSteps}`}</small>
        <b aria-hidden="true">→</b>
      </span>
    </button>
  );
}

interface PostTherapyFormProps {
  catalog: Exercise[];
  // Present when correcting a saved session instead of creating one.
  editingSession?: RehabSession;
  routines: Routine[];
  defaultOccurredAt: string;
  errorMessage?: string;
  recentSessions: RehabSession[];
}

export function PostTherapyForm({
  catalog,
  editingSession,
  routines,
  defaultOccurredAt,
  errorMessage,
  recentSessions,
}: PostTherapyFormProps) {
  const router = useAppRouter();
  const [actionState, formAction] = useActionState(
    editingSession ? updateRehabSessionAction : createPostTherapySessionAction,
    { error: errorMessage ?? null },
  );
  const [occurredAt, setOccurredAt] = useState(() =>
    toRecoveryDateTimeLocal(editingSession?.occurredAt ?? defaultOccurredAt),
  );
  const [showDateTime, setShowDateTime] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>(
    editingSession?.sessionType ?? "PHYSIOTHERAPY",
  );
  const [painBefore, setPainBefore] = useState<PainScore | null>(
    editingSession?.painBefore ?? 3,
  );
  const [painDuring, setPainDuring] = useState<PainScore | null>(
    editingSession?.painDuring ?? null,
  );
  const [painAfter, setPainAfter] = useState<PainScore | null>(
    editingSession?.painAfter ?? null,
  );
  const [perceivedLoad, setPerceivedLoad] = useState<Rating1To5>(
    editingSession?.perceivedLoad ?? 3,
  );
  const [finalState, setFinalState] = useState<FinalState | null>(
    editingSession?.finalState ?? null,
  );
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntryDraft[]>(() =>
    editingSession ? sessionToExerciseEntries(editingSession, createDraftId) : [],
  );
  const [showNote, setShowNote] = useState(Boolean(editingSession?.notes));
  const [sessionNote, setSessionNote] = useState(editingSession?.notes ?? "");
  // Kept while switching session type, but only sent for physio sessions.
  const [treatmentDrafts, setTreatmentDrafts] = useState<TreatmentDraft[]>(() =>
    editingSession ? sessionToTreatmentDrafts(editingSession, createDraftId) : [],
  );
  const [therapistNotes, setTherapistNotes] = useState(editingSession?.therapistNotes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { pending: deletePending, run } = useActionFeedback();
  const isPhysiotherapy = sessionType === "PHYSIOTHERAPY";
  const today = getRecoveryDateKey(defaultOccurredAt);
  const contextDate = formatContextDate(occurredAt, today);
  const historyHref = editingSession
    ? getHistoryHrefForDate(getRecoveryDateKey(editingSession.occurredAt), today)
    : "/historial";

  function deleteSession() {
    if (!editingSession) return;
    run(() => deleteRehabSessionAction(editingSession.id), {
      success: "Sesión eliminada",
      fallbackError: "No se pudo eliminar la sesión.",
      onSuccess: () => {
        setConfirmDelete(false);
        router.push(historyHref);
      },
      onError: (message) => setDeleteError(message || null),
    });
  }

  const repeatedEntryIds = findRepeatedEntryIds(exerciseEntries, catalog);
  const exerciseCount = exerciseEntries.filter(
    (entry) => isExerciseEntryComplete(entry) && !repeatedEntryIds.has(entry.id),
  ).length;
  const treatmentCount = isPhysiotherapy ? countValidTreatments(treatmentDrafts) : 0;
  const progress = getSessionFormProgress({
    painBefore,
    painDuring,
    painAfter,
    finalState,
    exerciseCount,
    selectedExerciseCount: exerciseEntries.length,
    treatmentCount,
    selectedTreatmentCount: isPhysiotherapy ? treatmentDrafts.length : 0,
  });
  const painComplete =
    painBefore !== null && painDuring !== null && painAfter !== null;
  return (
    <>
      <form action={formAction} className="rr-session-form">
        <FormPendingReporter />
        {editingSession ? (
          <input name="sessionId" type="hidden" value={editingSession.id} />
        ) : null}
        <header className="rr-registrar-header">
          <div className="rr-registrar-title">
            {editingSession ? (
              <Link aria-label="Volver a Historial" href={historyHref}>
                <span aria-hidden="true">‹</span>
              </Link>
            ) : (
              <Link aria-label="Volver a Hoy" href="/">
                <span aria-hidden="true">‹</span>
              </Link>
            )}
            <div>
              <p>{contextDate}</p>
              <h1>{editingSession ? "Editar sesión" : "Registrar"}</h1>
            </div>
            <span>{contextDate}</span>
          </div>

          <div className="rr-registrar-controls">
            {editingSession ? null : (
              <nav aria-label="Tipo de registro" className="rr-mode-switch">
                <Link aria-current="page" className="is-active" href="/registrar?mode=session">
                  Sesion
                </Link>
                <Link href="/registrar?mode=closeout">Cierre del dia</Link>
              </nav>
            )}
            <div className="rr-form-progress" aria-live="polite">
              <span>
                <i style={{ width: `${(progress.completedSteps / progress.totalSteps) * 100}%` }} />
              </span>
              <b className={progress.isComplete ? "is-complete" : ""}>
                {progress.isComplete
                  ? "Listo para guardar"
                  : `${progress.completedSteps} de ${progress.totalSteps}`}
              </b>
            </div>
          </div>
        </header>

        {actionState.error ? (
          <div className="rr-session-error" role="alert">
            <strong>No se guardó la sesión.</strong> {actionState.error}
          </div>
        ) : null}

        <div className="rr-session-grid">
          <section className="rr-form-card rr-context-card">
            <SectionHeader complete title="Contexto" />
            <button
              className="rr-context-time"
              onClick={() => setShowDateTime((visible) => !visible)}
              type="button"
            >
              <span>{contextDate}</span>
              <small>{showDateTime ? "cerrar" : "cambiar"}</small>
            </button>
            {showDateTime ? (
              <label className="rr-date-control">
                <span>Fecha y hora</span>
                <input
                  name="occurredAt"
                  onChange={(event) => setOccurredAt(event.target.value)}
                  max={`${today}T23:59`}
                  required
                  type="datetime-local"
                  value={occurredAt}
                />
              </label>
            ) : (
              <input name="occurredAt" type="hidden" value={occurredAt} />
            )}
            <div className="rr-session-type-grid">
              {sessionTypeOptions.map((option) => (
                <label className={sessionType === option.value ? "is-selected" : ""} key={option.value}>
                  <input
                    checked={sessionType === option.value}
                    name="sessionType"
                    onChange={() => setSessionType(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rr-form-card rr-pain-card">
            <SectionHeader
              complete={painComplete}
              title="Dolor"
              trailing={<span className="rr-slider-hint"><i className="rr-mobile-only">desliza</i><i className="rr-desktop-only">arrastra</i> · 0 a 10</span>}
            />
            <div className="rr-pain-list">
              <RitualPainSlider label="Antes" name="painBefore" onChange={setPainBefore} value={painBefore} />
              <RitualPainSlider label="Durante" name="painDuring" onChange={setPainDuring} value={painDuring} />
              <RitualPainSlider label="Despues" name="painAfter" onChange={setPainAfter} value={painAfter} />
            </div>
          </section>

          <section className="rr-form-card rr-load-card">
            <SectionHeader complete title="Esfuerzo de la sesion" />
            <p className="rr-field-question">¿Que tan exigente fue la sesion?</p>
            <div className="rr-choice-row rr-load-choice-row" role="group" aria-label="Carga percibida">
              {loadOptions.map((option) => (
                <label className={perceivedLoad === option.value ? "is-selected" : ""} key={option.value}>
                  <input
                    checked={perceivedLoad === option.value}
                    name="perceivedLoad"
                    onChange={() => setPerceivedLoad(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rr-form-card rr-final-state-card">
            <SectionHeader complete={finalState !== null} title="Estado al terminar" />
            <p className="rr-field-question">¿Como quedo la rodilla justo al terminar?</p>
            <div className="rr-choice-row rr-final-state-row" role="group" aria-label="Estado de la rodilla al terminar">
              {finalStateOptions.map((option) => (
                <label className={finalState === option.value ? "is-selected" : ""} key={option.value}>
                  <input
                    checked={finalState === option.value}
                    name="finalState"
                    onChange={() => setFinalState(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rr-form-card rr-exercises-card">
            <SectionHeader
              complete={
                exerciseEntries.length > 0 &&
                exerciseCount === exerciseEntries.length
              }
              title={isPhysiotherapy ? "Ejercicios o tratamientos" : "Ejercicios"}
              trailing={
                <span className="rr-exercise-actions">
                  <b>{exerciseCount}/{exerciseEntries.length} completos</b>
                </span>
              }
            />
            <ExerciseEntryEditor
              addActions={
                // "Usar rutina" would replace what the saved session already has.
                editingSession ? undefined : (
                  <RoutinePicker
                    catalog={catalog}
                    entries={exerciseEntries}
                    onChange={setExerciseEntries}
                    routines={routines}
                  />
                )
              }
              catalog={catalog}
              entries={exerciseEntries}
              onChange={setExerciseEntries}
            />
            <input
              name="exercisesPayload"
              type="hidden"
              value={JSON.stringify(toExercisePayload(exerciseEntries))}
            />
          </section>

          {isPhysiotherapy ? (
            <>
              <TreatmentsCard
                drafts={treatmentDrafts}
                onChange={setTreatmentDrafts}
                onTherapistNotesChange={setTherapistNotes}
                therapistNotes={therapistNotes}
              />
              <input
                name="treatmentsPayload"
                type="hidden"
                value={JSON.stringify(toTreatmentPayload(treatmentDrafts))}
              />
            </>
          ) : null}

          <section className={`rr-note-card ${showNote ? "is-open" : ""}`}>
            {showNote ? (
              <>
                <div>
                  <h2>Nota</h2>
                  <button onClick={() => setShowNote(false)} type="button">Quitar</button>
                </div>
                <textarea
                  name="notes"
                  onChange={(event) => setSessionNote(event.target.value)}
                  placeholder="Algo que quieras recordar..."
                  value={sessionNote}
                />
              </>
            ) : (
              <button onClick={() => setShowNote(true)} type="button">+ Añadir nota (opcional)</button>
            )}
          </section>

          {editingSession ? (
            <div className="rr-edit-record-actions">
              <button
                className="rr-modal-secondary is-danger"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDelete(true);
                }}
                type="button"
              >
                Eliminar sesión
              </button>
              <Link className="rr-modal-secondary" href={historyHref}>Cancelar</Link>
            </div>
          ) : (
            <section className="rr-recent-sessions">
              <h2>Recientes</h2>
              {recentSessions.length === 0 ? (
                <p>Tu primera sesion aparecera aqui despues de guardarla.</p>
              ) : (
                recentSessions.slice(0, 2).map((session) => (
                  <article key={session.id}>
                    <strong>{formatSessionDay(session.occurredAt)}</strong>
                    <span>
                      {sessionTypeLabel(session.sessionType)} · {session.exercises.length} ejercicio{session.exercises.length === 1 ? "" : "s"} · dolor {session.painBefore}→{session.painAfter}
                    </span>
                    <b aria-hidden="true">✓</b>
                  </article>
                ))
              )}
            </section>
          )}
        </div>

        <footer className="rr-session-save-bar">
          <SaveButton
            exerciseCount={exerciseCount}
            isComplete={progress.isComplete}
            isEditing={Boolean(editingSession)}
            missingSteps={progress.missingSteps}
            treatmentCount={treatmentCount}
          />
        </footer>
      </form>
      {editingSession ? (
        <DeleteRecordDialog
          consequence="Se borran sus ejercicios, series y tratamientos."
          description={`${sessionTypeLabel(editingSession.sessionType)} · ${formatContextDate(toRecoveryDateTimeLocal(editingSession.occurredAt), today)}`}
          error={deleteError}
          onClose={() => setConfirmDelete(false)}
          onConfirm={deleteSession}
          open={confirmDelete}
          pending={deletePending}
          title="¿Eliminar esta sesión?"
        />
      ) : null}
    </>
  );
}
