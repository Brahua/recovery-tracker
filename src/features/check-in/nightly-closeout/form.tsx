"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { useFormStatus } from "react-dom";

import { RitualPainSlider } from "@/components/ritual-pain-slider";
import { createNightlyCloseoutAction } from "@/features/check-in/nightly-closeout/actions";
import {
  CloseoutDateContext,
  formatCloseoutDateLabel,
} from "@/features/check-in/nightly-closeout/date-context";
import { getCloseoutFormProgress } from "@/lib/closeout-form-state";
import { getRecoveryDateKey } from "@/lib/recovery-date";
import type {
  NightlyCloseout,
  PainScore,
  Rating1To5,
  RehabSession,
  ReboundLevel,
} from "@/types/recovery";

const energyOptions: Array<{ value: Rating1To5; label: string }> = [
  { value: 1, label: "Muy baja" },
  { value: 2, label: "Baja" },
  { value: 3, label: "Media" },
  { value: 4, label: "Alta" },
  { value: 5, label: "Muy alta" },
];

const sleepQualityOptions: Array<{ value: Rating1To5; label: string }> = [
  { value: 1, label: "Muy mala" },
  { value: 2, label: "Mala" },
  { value: 3, label: "Regular" },
  { value: 4, label: "Buena" },
  { value: 5, label: "Muy buena" },
];

const reboundOptions: Array<{ value: ReboundLevel; label: string }> = [
  { value: "NONE", label: "Nada" },
  { value: "MILD", label: "Leve" },
  { value: "MODERATE", label: "Moderado" },
  { value: "STRONG", label: "Fuerte" },
];

function formatHeaderContext(value: string) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(date);
  const time = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${day} · ${time}`;
}

function formatRecentDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const key = date.toDateString();

  if (key === today.toDateString()) return "Hoy";
  if (key === yesterday.toDateString()) return "Anoche";
  return new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(date);
}

function ratingLabel(
  value: Rating1To5,
  options: Array<{ value: Rating1To5; label: string }>,
) {
  return options.find((option) => option.value === value)?.label ?? `${value}/5`;
}

function formatSleepHours(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(".", ",");
}

function CloseoutSectionHeader({
  complete,
  desktopTitle,
  hint,
  title,
}: {
  complete: boolean;
  desktopTitle: string;
  hint?: string;
  title: string;
}) {
  return (
    <div className="rr-closeout-section-heading">
      <span aria-hidden="true" className={`rr-step-badge ${complete ? "is-complete" : ""}`}>
        {complete ? "✓" : ""}
      </span>
      <h2><span>{title}</span><span>{desktopTitle}</span></h2>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function CloseoutSaveButton({
  isComplete,
  missingSteps,
}: {
  isComplete: boolean;
  missingSteps: number;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`rr-closeout-save ${isComplete ? "is-ready" : ""}`}
      disabled={!isComplete || pending}
      type="submit"
    >
      <span>{pending ? "Guardando..." : "Cerrar el dia"}</span>
      <span>
        <small>{isComplete ? "1 min" : `faltan ${missingSteps}`}</small>
        <b aria-hidden="true">☾</b>
      </span>
    </button>
  );
}

interface NightlyCloseoutFormProps {
  defaultOccurredAt: string;
  errorMessage?: string;
  recentCloseouts: NightlyCloseout[];
  selectedCloseout?: NightlyCloseout;
  selectedDate: string;
  selectedSession?: RehabSession;
}

export function NightlyCloseoutForm({
  defaultOccurredAt,
  errorMessage,
  recentCloseouts,
  selectedCloseout,
  selectedDate,
  selectedSession,
}: NightlyCloseoutFormProps) {
  const router = useRouter();
  const [actionState, formAction] = useActionState(
    createNightlyCloseoutAction,
    { error: errorMessage ?? null },
  );
  const [isDatePending, startDateTransition] = useTransition();
  const [endOfDayPain, setEndOfDayPain] = useState<PainScore | null>(null);
  const [energy, setEnergy] = useState<Rating1To5 | null>(null);
  const [reboundPainLevel, setReboundPainLevel] = useState<ReboundLevel | null>(null);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState<Rating1To5 | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const today = getRecoveryDateKey(defaultOccurredAt);
  const dateLabel = formatCloseoutDateLabel(selectedDate, today);
  const dateHasCloseout = selectedCloseout?.date === selectedDate;
  const sessionForDate =
    selectedSession &&
    getRecoveryDateKey(selectedSession.occurredAt) === selectedDate
      ? selectedSession
      : undefined;
  const progress = getCloseoutFormProgress({
    endOfDayPain,
    energy,
    reboundPainLevel,
    sleepQuality,
  });
  const stateComplete = energy !== null && reboundPainLevel !== null;
  const progressStyle = {
    "--rr-closeout-progress": `${(progress.completedSteps / progress.totalSteps) * 100}%`,
  } as CSSProperties;

  function changeSleepHours(delta: number) {
    setSleepHours((current) => Math.min(24, Math.max(0, current + delta)));
  }

  function changeDate(nextDate: string) {
    startDateTransition(() => {
      router.replace(`/registrar?mode=closeout&date=${encodeURIComponent(nextDate)}`);
    });
  }

  return (
    <form action={formAction} className="rr-closeout-form">
      <div aria-hidden="true" className="rr-closeout-glow" />
      <header className="rr-registrar-header rr-closeout-header">
        <div className="rr-registrar-title">
          <Link aria-label="Volver a Hoy" href="/"><span aria-hidden="true">‹</span></Link>
          <div>
            <p>{dateLabel} · {formatHeaderContext(defaultOccurredAt).split(" · ")[1]}</p>
            <h1>Registrar</h1>
          </div>
          <span>☾ {dateLabel} · {formatHeaderContext(defaultOccurredAt).split(" · ")[1]}</span>
        </div>

        <div className="rr-registrar-controls">
          <nav aria-label="Tipo de registro" className="rr-mode-switch">
            <Link href="/registrar?mode=session">Sesion</Link>
            <Link aria-current="page" className="is-active" href="/registrar?mode=closeout">Cierre del dia</Link>
          </nav>
          <div className="rr-closeout-progress" aria-live="polite" style={progressStyle}>
            <span><i /><em aria-hidden="true">☾</em></span>
            <b className={progress.isComplete ? "is-complete" : ""}>
              {progress.isComplete ? "Listo para cerrar" : `${progress.completedSteps} de ${progress.totalSteps}`}
            </b>
          </div>
        </div>
      </header>

      {actionState.error ? (
        <div className="rr-session-error" role="alert">
          <strong>No se guardó el cierre.</strong> {actionState.error}
        </div>
      ) : null}

      <CloseoutDateContext
        dateLabel={dateLabel}
        hasCloseout={dateHasCloseout}
        isPending={isDatePending}
        onChange={changeDate}
        selectedDate={selectedDate}
        today={today}
      />

      <p className="rr-closeout-intro">
        Un minuto para registrar cómo quedó la rodilla {selectedDate === today ? "hoy" : "ese día"}.
      </p>

      <section className="rr-closeout-recap">
        <span aria-hidden="true">☾</span>
        <div>
          <strong>El día ya está hecho.</strong>
          <p>
            {sessionForDate
              ? `Sesion completada · ${sessionForDate.exercises.length} ejercicios · dolor ${sessionForDate.painBefore}→${sessionForDate.painAfter}. Solo queda cerrarlo.`
              : `Puedes cerrar ${selectedDate === today ? "el día" : "ese día"} aunque no haya una sesión registrada.`}
          </p>
        </div>
      </section>

      <div className="rr-closeout-grid">
        <div className="rr-closeout-questions">
          <section className="rr-closeout-question rr-closeout-pain-question">
            <CloseoutSectionHeader
              complete={endOfDayPain !== null}
              desktopTitle="¿Como queda la rodilla?"
              hint="dolor · 0 a 10"
              title="Dolor al final del dia"
            />
            <RitualPainSlider
              label="Dolor"
              name="endOfDayPain"
              onChange={setEndOfDayPain}
              value={endOfDayPain}
            />
          </section>

          <section className="rr-closeout-question rr-closeout-state-question">
            <CloseoutSectionHeader
              complete={stateComplete}
              desktopTitle={
                selectedDate === today
                  ? "¿Con cuánta energía terminas?"
                  : "¿Con cuánta energía terminaste?"
              }
              title="Como estas"
            />
            <div className="rr-closeout-field-group">
              <h3>Energía {selectedDate === today ? "hoy" : "ese día"}</h3>
              <div className="rr-closeout-choice-row rr-five-choice-row" role="group" aria-label="Energia al final del dia">
                {energyOptions.map((option) => (
                  <label className={energy === option.value ? "is-selected" : ""} key={option.value}>
                    <input checked={energy === option.value} name="energy" onChange={() => setEnergy(option.value)} type="radio" value={option.value} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="rr-closeout-field-group rr-rebound-field">
              <h3>¿Se resintio la rodilla despues de la sesion?</h3>
              <div className="rr-closeout-choice-row rr-rebound-choice-row" role="group" aria-label="Nivel de rebote">
                {reboundOptions.map((option) => (
                  <label className={reboundPainLevel === option.value ? "is-selected" : ""} key={option.value}>
                    <input checked={reboundPainLevel === option.value} name="reboundPainLevel" onChange={() => setReboundPainLevel(option.value)} type="radio" value={option.value} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rr-closeout-question rr-closeout-sleep-question">
            <CloseoutSectionHeader
              complete={sleepQuality !== null}
              desktopTitle="Sueno de anoche"
              title="Sueno de anoche"
            />
            <div className="rr-sleep-hours">
              <h3>Horas</h3>
              <div>
                <button aria-label="Restar media hora" onClick={() => changeSleepHours(-0.5)} type="button">−</button>
                <output>{formatSleepHours(sleepHours)} h</output>
                <button aria-label="Sumar media hora" onClick={() => changeSleepHours(0.5)} type="button">+</button>
              </div>
              <input name="sleepHours" type="hidden" value={sleepHours} />
            </div>
            <div className="rr-closeout-field-group">
              <h3>Calidad</h3>
              <div className="rr-closeout-choice-row rr-five-choice-row" role="group" aria-label="Calidad del sueno">
                {sleepQualityOptions.map((option) => (
                  <label className={sleepQuality === option.value ? "is-selected" : ""} key={option.value}>
                    <input checked={sleepQuality === option.value} name="sleepQuality" onChange={() => setSleepQuality(option.value)} type="radio" value={option.value} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="rr-closeout-side">
          {!showNote ? (
            <button className="rr-closeout-note-toggle" onClick={() => setShowNote(true)} type="button">+ Añadir nota (opcional)</button>
          ) : null}
          <section className={`rr-closeout-note ${showNote ? "is-open" : ""}`}>
            <div>
              <h2>Una línea sobre {selectedDate === today ? "hoy" : "ese día"}</h2>
              <span>opcional</span>
            </div>
            <textarea
              name="notes"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Lo que quieras dejar escrito antes de dormir..."
              value={note}
            />
          </section>

          <section className="rr-closeout-recent">
            <h2>Cierres recientes</h2>
            {recentCloseouts.length === 0 ? (
              <p>Tu primer cierre aparecera aqui despues de guardarlo.</p>
            ) : (
              recentCloseouts.slice(0, 2).map((closeout) => (
                <article key={closeout.id}>
                  <strong>{formatRecentDay(closeout.date)}</strong>
                  <span>
                    Dolor {closeout.endOfDayPain} · energia {ratingLabel(closeout.energy, energyOptions).toLowerCase()} · {formatSleepHours(closeout.sleepHours)} h {ratingLabel(closeout.sleepQuality, sleepQualityOptions).toLowerCase()}
                  </span>
                  <b aria-hidden="true">✓</b>
                </article>
              ))
            )}
          </section>
        </aside>
      </div>

      <footer className="rr-closeout-save-bar">
        <CloseoutSaveButton
          isComplete={progress.isComplete && !dateHasCloseout && !isDatePending}
          missingSteps={progress.missingSteps}
        />
      </footer>
    </form>
  );
}
