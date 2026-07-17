"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { ExerciseEntryEditor } from "@/components/exercise-entry-editor";
import { RitualPainSlider } from "@/components/ritual-pain-slider";
import { createPostTherapySessionAction } from "@/features/check-in/post-therapy/actions";
import { exerciseShortcuts } from "@/lib/constants/exercises";
import {
  isExerciseEntryComplete,
  type ExerciseEntryDraft,
} from "@/lib/exercise-entry-state";
import { getSessionFormProgress } from "@/lib/session-form-state";
import type {
  FinalState,
  PainScore,
  Rating1To5,
  RehabSession,
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

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatContextDate(value: string) {
  const time = value.slice(11, 16);
  return `Hoy · ${time || "--:--"}`;
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
  missingSteps,
}: {
  exerciseCount: number;
  isComplete: boolean;
  missingSteps: number;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`rr-session-save ${isComplete ? "is-ready" : ""}`}
      disabled={!isComplete || pending}
      type="submit"
    >
      <span>{pending ? "Guardando..." : "Guardar sesion"}</span>
      <span>
        <small>{isComplete ? `18 min · ${exerciseCount}/${exerciseShortcuts.length}` : `faltan ${missingSteps}`}</small>
        <b aria-hidden="true">→</b>
      </span>
    </button>
  );
}

interface PostTherapyFormProps {
  defaultOccurredAt: string;
  errorMessage?: string;
  recentSessions: RehabSession[];
}

export function PostTherapyForm({
  defaultOccurredAt,
  errorMessage,
  recentSessions,
}: PostTherapyFormProps) {
  const [actionState, formAction] = useActionState(
    createPostTherapySessionAction,
    { error: errorMessage ?? null },
  );
  const [occurredAt, setOccurredAt] = useState(() =>
    toDateTimeLocalValue(defaultOccurredAt),
  );
  const [showDateTime, setShowDateTime] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("PHYSIOTHERAPY");
  const [painBefore, setPainBefore] = useState<PainScore | null>(3);
  const [painDuring, setPainDuring] = useState<PainScore | null>(null);
  const [painAfter, setPainAfter] = useState<PainScore | null>(null);
  const [perceivedLoad, setPerceivedLoad] = useState<Rating1To5>(3);
  const [finalState, setFinalState] = useState<FinalState | null>(null);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntryDraft[]>([]);
  const [showNote, setShowNote] = useState(false);
  const [sessionNote, setSessionNote] = useState("");

  const exerciseCount = exerciseEntries.filter(isExerciseEntryComplete).length;
  const progress = getSessionFormProgress({
    painBefore,
    painDuring,
    painAfter,
    finalState,
    exerciseCount,
    selectedExerciseCount: exerciseEntries.length,
  });
  const painComplete =
    painBefore !== null && painDuring !== null && painAfter !== null;
  return (
    <form action={formAction} className="rr-session-form">
      <header className="rr-registrar-header">
        <div className="rr-registrar-title">
          <Link aria-label="Volver a Hoy" href="/">
            <span aria-hidden="true">‹</span>
          </Link>
          <div>
            <p>{formatContextDate(occurredAt)}</p>
            <h1>Registrar</h1>
          </div>
          <span>{formatContextDate(occurredAt)}</span>
        </div>

        <div className="rr-registrar-controls">
          <nav aria-label="Tipo de registro" className="rr-mode-switch">
            <Link aria-current="page" className="is-active" href="/registrar?mode=session">
              Sesion
            </Link>
            <Link href="/registrar?mode=closeout">Cierre del dia</Link>
          </nav>
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
            <span>{formatContextDate(occurredAt)}</span>
            <small>{showDateTime ? "cerrar" : "cambiar"}</small>
          </button>
          {showDateTime ? (
            <label className="rr-date-control">
              <span>Fecha y hora</span>
              <input
                name="occurredAt"
                onChange={(event) => setOccurredAt(event.target.value)}
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
            title="Ejercicios"
            trailing={
              <span className="rr-exercise-actions">
                <b>{exerciseCount}/{exerciseEntries.length} completos</b>
              </span>
            }
          />
          <ExerciseEntryEditor entries={exerciseEntries} onChange={setExerciseEntries} />
        </section>

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

        <section className="rr-recent-sessions">
          <h2>Recientes</h2>
          {recentSessions.length === 0 ? (
            <p>Tu primera sesion aparecera aqui despues de guardarla.</p>
          ) : (
            recentSessions.slice(0, 2).map((session) => (
              <article key={session.id}>
                <strong>{formatSessionDay(session.occurredAt)}</strong>
                <span>
                  {sessionTypeLabel(session.sessionType)} · {session.exercises.length}/{exerciseShortcuts.length} · dolor {session.painBefore}→{session.painAfter}
                </span>
                <b aria-hidden="true">✓</b>
              </article>
            ))
          )}
        </section>
      </div>

      <footer className="rr-session-save-bar">
        <SaveButton
          exerciseCount={exerciseCount}
          isComplete={progress.isComplete}
          missingSteps={progress.missingSteps}
        />
      </footer>
    </form>
  );
}
