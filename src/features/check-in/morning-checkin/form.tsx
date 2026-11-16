"use client";

import Link from "@/components/app-link";
import { useActionState, useState, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";

import { DateField } from "@/components/date-field";
import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { FormPendingReporter } from "@/components/feedback/form-pending-reporter";
import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { RitualPainSlider } from "@/components/ritual-pain-slider";
import { useAppRouter } from "@/components/use-app-router";
import {
  createMorningCheckinAction,
  deleteMorningCheckinAction,
  updateMorningCheckinAction,
} from "@/features/check-in/morning-checkin/actions";
import { formatCloseoutDateLabel } from "@/features/check-in/nightly-closeout/date-context";
import { conditionAreaPhrase, type Condition } from "@/lib/condition";
import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { duplicateMorningDateMessage } from "@/lib/morning-checkin-date";
import { formatSleepHours, getMorningCheckinFormProgress } from "@/lib/morning-checkin-form-state";
import type {
  MorningCheckin,
  PainScore,
  Rating1To5,
  ReboundLevel,
  StiffnessLevel,
} from "@/types/recovery";

export const sleepQualityOptions: Array<{ value: Rating1To5; label: string }> = [
  { value: 1, label: "Muy mal" },
  { value: 2, label: "Mal" },
  { value: 3, label: "Regular" },
  { value: 4, label: "Bien" },
  { value: 5, label: "Muy bien" },
];

const reboundOptions: Array<{ value: ReboundLevel; label: string }> = [
  { value: "NONE", label: "Nada" },
  { value: "MILD", label: "Leve" },
  { value: "MODERATE", label: "Moderado" },
  { value: "STRONG", label: "Fuerte" },
];

const stiffnessOptions: Array<{ value: StiffnessLevel; label: string }> = [
  { value: "NONE", label: "Ninguna" },
  { value: "MILD", label: "Un poco" },
  { value: "MODERATE", label: "Bastante" },
  { value: "STRONG", label: "Mucha" },
];

function SectionHeader({
  complete,
  hint,
  title,
}: {
  complete: boolean;
  hint?: string;
  title: string;
}) {
  return (
    <div className="rr-closeout-section-heading">
      <span aria-hidden="true" className={`rr-step-badge ${complete ? "is-complete" : ""}`}>
        {complete ? "✓" : ""}
      </span>
      <h2>
        <span>{title}</span>
        <span>{title}</span>
      </h2>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function SaveButton({
  isComplete,
  isEditing,
  missingSteps,
}: {
  isComplete: boolean;
  isEditing: boolean;
  missingSteps: number;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`rr-closeout-save ${isComplete ? "is-ready" : ""}`}
      disabled={!isComplete || pending}
      type="submit"
    >
      <span>{pending ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar mañana"}</span>
      <span>
        <small>{isComplete ? "1 min" : `faltan ${missingSteps}`}</small>
        <b aria-hidden="true">☀</b>
      </span>
    </button>
  );
}

function ChoiceRow<T extends string | number>({
  label,
  name,
  onChange,
  options,
  value,
  wide,
}: {
  label: string;
  name: string;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  value: T | null;
  wide?: boolean;
}) {
  return (
    <div
      aria-label={label}
      className={`rr-closeout-choice-row ${wide ? "rr-five-choice-row" : "rr-rebound-choice-row"}`}
      role="group"
    >
      {options.map((option) => (
        <label className={value === option.value ? "is-selected" : ""} key={option.value}>
          <input
            checked={value === option.value}
            name={name}
            onChange={() => onChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

interface MorningCheckinFormProps {
  /** Today in Lima ("YYYY-MM-DD"). */
  today: string;
  selectedDate: string;
  /** Whether the day before selectedDate had sessions: only then the rebound is asked. */
  hadSessionsDayBefore: boolean;
  /** A check-in already saved for selectedDate (creating another one is blocked). */
  existingCheckin?: MorningCheckin;
  /** Present when correcting a saved check-in instead of creating one. */
  editingCheckin?: MorningCheckin;
  errorMessage?: string;
  condition?: Condition | null;
}

export function MorningCheckinForm({
  today,
  selectedDate,
  hadSessionsDayBefore,
  existingCheckin,
  editingCheckin,
  errorMessage,
  condition,
}: MorningCheckinFormProps) {
  const areaPhrase = conditionAreaPhrase(condition);
  const router = useAppRouter();
  const [actionState, formAction] = useActionState(
    editingCheckin ? updateMorningCheckinAction : createMorningCheckinAction,
    { error: errorMessage ?? null },
  );
  const [sleepHours, setSleepHours] = useState(editingCheckin?.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState<Rating1To5 | null>(
    editingCheckin?.sleepQuality ?? null,
  );
  const [wakingPain, setWakingPain] = useState<PainScore | null>(
    editingCheckin?.wakingPain ?? null,
  );
  const [stiffnessLevel, setStiffnessLevel] = useState<StiffnessLevel | null>(
    editingCheckin?.stiffnessLevel ?? null,
  );
  const [reboundPainLevel, setReboundPainLevel] = useState<ReboundLevel | null>(
    editingCheckin?.reboundPainLevel ?? null,
  );
  const [showNote, setShowNote] = useState(Boolean(editingCheckin?.notes));
  const [note, setNote] = useState(editingCheckin?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { pending: deletePending, run } = useActionFeedback();
  const isDatePending = router.pending;
  const dateLabel = formatCloseoutDateLabel(selectedDate, today);
  const isToday = selectedDate === today;
  const dateTaken = Boolean(existingCheckin && existingCheckin.id !== editingCheckin?.id);
  const historyHref = editingCheckin
    ? getHistoryHrefForDate(editingCheckin.date, today)
    : "/historial";
  const progress = getMorningCheckinFormProgress({
    sleepQuality,
    wakingPain,
    stiffnessLevel,
    reboundPainLevel,
    asksRebound: hadSessionsDayBefore,
  });
  const progressStyle = {
    "--rr-closeout-progress": `${(progress.completedSteps / progress.totalSteps) * 100}%`,
  } as CSSProperties;
  const area = areaPhrase ?? "la zona tratada";

  function changeSleepHours(delta: number) {
    setSleepHours((current) => Math.min(24, Math.max(0, current + delta)));
  }

  function changeDate(nextDate: string) {
    const date = encodeURIComponent(nextDate);
    router.replace(
      editingCheckin
        ? `/registrar/manana/${editingCheckin.id}?date=${date}`
        : `/registrar?mode=morning&date=${date}`,
    );
  }

  function deleteCheckin() {
    if (!editingCheckin) return;
    run(() => deleteMorningCheckinAction(editingCheckin.id), {
      success: "Registro de la mañana eliminado",
      fallbackError: "No se pudo eliminar el registro.",
      onSuccess: () => {
        setConfirmDelete(false);
        router.push(historyHref);
      },
      onError: (message) => setDeleteError(message || null),
    });
  }

  return (
    <>
      <form action={formAction} className="rr-closeout-form rr-morning-form">
        <FormPendingReporter />
        {editingCheckin ? <input name="checkinId" type="hidden" value={editingCheckin.id} /> : null}
        <div aria-hidden="true" className="rr-closeout-glow" />
        <header className="rr-registrar-header rr-closeout-header">
          <div className="rr-registrar-title">
            {editingCheckin ? (
              <Link aria-label="Volver a Historial" href={historyHref}>
                <span aria-hidden="true">‹</span>
              </Link>
            ) : null}
            <div>
              <p className="rr-kicker">{dateLabel}</p>
              <h1 className="rr-page-title">
                {editingCheckin ? "Editar mañana" : "¿Cómo amaneciste?"}
              </h1>
            </div>
          </div>

          <div className="rr-registrar-controls">
            {editingCheckin ? null : (
              <nav aria-label="Tipo de registro" className="rr-mode-switch">
                <Link href="/registrar?mode=session">Sesion</Link>
                <Link aria-current="page" className="is-active" href="/registrar?mode=morning">
                  Mañana
                </Link>
              </nav>
            )}
            <div className="rr-closeout-progress" aria-live="polite" style={progressStyle}>
              <span>
                <i />
                <em aria-hidden="true">☀</em>
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
            <strong>No se guardó el registro.</strong> {actionState.error}
          </div>
        ) : null}

        <section aria-label="Fecha de la mañana" className="rr-closeout-date-context">
          <DateField
            defaultValue={selectedDate}
            display={dateLabel}
            key={selectedDate}
            label="Día en que despertaste"
            max={today}
            name="date"
            onChange={(event) => {
              const date = event.target.value;
              if (date && date !== selectedDate) changeDate(date);
            }}
            required
            type="date"
          />
          {isDatePending ? <p role="status">Buscando registros de ese día…</p> : null}
          {dateTaken ? (
            <p className="rr-closeout-date-warning" role="alert">
              {duplicateMorningDateMessage}
            </p>
          ) : null}
        </section>

        <p className="rr-closeout-intro">
          Un minuto para contar cómo {isToday ? "amaneciste hoy" : "amaneciste ese día"}: la noche y{" "}
          {areaPhrase ?? "tu cuerpo"} al despertar.
        </p>

        <div className="rr-closeout-grid">
          <div className="rr-closeout-questions">
            <section className="rr-closeout-question rr-closeout-sleep-question">
              <SectionHeader complete={sleepQuality !== null} title="Sueño de anoche" />
              <div className="rr-sleep-hours">
                <h3>¿Cuántas horas dormiste?</h3>
                <div>
                  <button
                    aria-label="Restar media hora"
                    onClick={() => changeSleepHours(-0.5)}
                    type="button"
                  >
                    −
                  </button>
                  <output>{formatSleepHours(sleepHours)} h</output>
                  <button
                    aria-label="Sumar media hora"
                    onClick={() => changeSleepHours(0.5)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <input name="sleepHours" type="hidden" value={sleepHours} />
              </div>
              <div className="rr-closeout-field-group">
                <h3>¿Cómo dormiste?</h3>
                <ChoiceRow
                  label="Calidad del sueño"
                  name="sleepQuality"
                  onChange={setSleepQuality}
                  options={sleepQualityOptions}
                  value={sleepQuality}
                  wide
                />
              </div>
            </section>

            <section className="rr-closeout-question rr-closeout-pain-question">
              <SectionHeader
                complete={wakingPain !== null}
                hint="dolor · 0 a 10"
                title={areaPhrase ? `¿Cómo amaneció ${areaPhrase}?` : "Dolor al despertar"}
              />
              <RitualPainSlider
                label="Dolor al despertar"
                name="wakingPain"
                onChange={setWakingPain}
                value={wakingPain}
              />
            </section>

            <section className="rr-closeout-question rr-closeout-state-question">
              <SectionHeader
                complete={
                  stiffnessLevel !== null && (!hadSessionsDayBefore || reboundPainLevel !== null)
                }
                title="Al despertar"
              />
              <div className="rr-closeout-field-group rr-rebound-field">
                <h3>¿Cuánta rigidez sentiste al despertar?</h3>
                <ChoiceRow
                  label="Rigidez al despertar"
                  name="stiffnessLevel"
                  onChange={setStiffnessLevel}
                  options={stiffnessOptions}
                  value={stiffnessLevel}
                />
              </div>
              {hadSessionsDayBefore ? (
                <div className="rr-closeout-field-group rr-rebound-field">
                  <h3>
                    ¿Se resintió {area} por la sesión {isToday ? "de ayer" : "del día anterior"}?
                  </h3>
                  <ChoiceRow
                    label="Rebote de la sesión anterior"
                    name="reboundPainLevel"
                    onChange={setReboundPainLevel}
                    options={reboundOptions}
                    value={reboundPainLevel}
                  />
                </div>
              ) : null}
            </section>
          </div>

          <aside className="rr-closeout-side">
            {!showNote ? (
              <button
                className="rr-closeout-note-toggle"
                onClick={() => setShowNote(true)}
                type="button"
              >
                + Añadir nota (opcional)
              </button>
            ) : null}
            <section className={`rr-closeout-note ${showNote ? "is-open" : ""}`}>
              <div>
                <h2>Una línea sobre la noche</h2>
                <span>opcional</span>
              </div>
              <textarea
                aria-label="Nota de la mañana"
                name="notes"
                onChange={(event) => setNote(event.target.value)}
                placeholder="Algo que quieras recordar: cómo dormiste, qué te despertó..."
                value={note}
              />
            </section>

            {editingCheckin ? (
              <div className="rr-edit-record-actions">
                <button
                  className="rr-modal-secondary is-danger"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmDelete(true);
                  }}
                  type="button"
                >
                  Eliminar registro
                </button>
                <Link className="rr-modal-secondary" href={historyHref}>
                  Cancelar
                </Link>
              </div>
            ) : null}
          </aside>
        </div>

        <footer className="rr-closeout-save-bar">
          <SaveButton
            isComplete={progress.isComplete && !dateTaken && !isDatePending}
            isEditing={Boolean(editingCheckin)}
            missingSteps={progress.missingSteps}
          />
        </footer>
      </form>
      {editingCheckin ? (
        <DeleteRecordDialog
          description={`Mañana del ${formatCloseoutDateLabel(editingCheckin.date, today).toLowerCase()}`}
          error={deleteError}
          onClose={() => setConfirmDelete(false)}
          onConfirm={deleteCheckin}
          open={confirmDelete}
          pending={deletePending}
          title="¿Eliminar este registro de la mañana?"
        />
      ) : null}
    </>
  );
}
