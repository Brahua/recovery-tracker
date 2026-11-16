import Link from "@/components/app-link";

import {
  buildRecentWeek,
  calculateLoggingStreak,
  getTodayRitualState,
  type RecentWeekDay,
} from "@/lib/today-view-model";
import { formatSessionGoal, sessionGoalFromMetadata } from "@/lib/session-goal";
import { getDayProgress, getWeekProgress, type WeekProgress } from "@/lib/session-goal-progress";
import type { RecoveryGoal } from "@/types/goals";
import type {
  LatestTherapistNotes,
  MorningCheckin,
  NightlyCloseout,
  RehabSession,
} from "@/types/recovery";
import { getRecoveryDateKey, recoveryTimeZone } from "@/lib/recovery-date";
import { formatTreatmentCount } from "@/lib/treatments";
import { GoalsCard } from "@/features/goals/goals-card";
import { conditionAreaPhrase, conditionSummary } from "@/lib/condition";
import { parseCondition } from "@/lib/validation/condition";
import { getUserDisplayName, type DisplayNameUser } from "@/lib/user-display-name";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: recoveryTimeZone,
});

const shortDateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
});

const stiffnessLabels: Record<MorningCheckin["stiffnessLevel"], string> = {
  NONE: "sin rigidez",
  MILD: "un poco de rigidez",
  MODERATE: "bastante rigidez",
  STRONG: "mucha rigidez",
};

function formatHours(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(".", ",");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const dayStatusLabels: Record<RecentWeekDay["status"], string> = {
  full: "meta cumplida",
  partial: "con sesiones, sin llegar a la meta",
  empty: "sin sesiones",
};

function WeekStrip({ days }: { days: RecentWeekDay[] }) {
  return (
    <ol className="rr-week" aria-label="Semana actual, de lunes a domingo">
      {days.map((day) => (
        <li
          aria-label={`${day.isToday ? "Hoy" : day.label}: ${dayStatusLabels[day.status]}`}
          className="rr-week-day"
          key={day.key}
        >
          <span
            aria-hidden="true"
            className={`rr-week-mark ${day.status === "full" ? "is-complete" : ""} ${
              day.status === "partial" ? "is-partial" : ""
            } ${day.isToday ? "is-today" : ""}`}
          >
            {day.status === "full" ? "✓" : day.status === "partial" ? "½" : day.isToday ? "·" : ""}
          </span>
          <span aria-hidden="true" className={day.isToday ? "is-today" : ""}>
            {day.isToday ? "Hoy" : day.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function weekGoalLine(week: WeekProgress) {
  return week.weekMet
    ? "Semana cumplida."
    : `${week.metDays} de ${week.daysPerWeek} días esta semana.`;
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 41;
  const circumference = 2 * Math.PI * radius;
  const visibleProgress = Math.max(progress, 3);
  const offset = circumference * (1 - visibleProgress / 100);

  return (
    <div className="rr-progress-ring" aria-label={`${progress}% de los rituales de hoy`}>
      <svg aria-hidden="true" viewBox="0 0 96 96">
        <circle cx="48" cy="48" fill="none" r={radius} strokeWidth="6" />
        <circle
          className="rr-progress-ring-value"
          cx="48"
          cy="48"
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeWidth="6"
        />
      </svg>
      <span>
        <strong>{progress}</strong>
        <small>%</small>
        <em>hoy</em>
      </span>
    </div>
  );
}

function PreviewLink({
  glyph,
  href,
  title,
  subtitle,
}: {
  glyph: string;
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link className="rr-preview-link" href={href}>
      <span aria-hidden="true">{glyph}</span>
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <b aria-hidden="true">›</b>
    </Link>
  );
}

function TherapistNotesCard({ notes }: { notes: LatestTherapistNotes }) {
  return (
    <section aria-labelledby="rr-therapist-notes-title" className="rr-therapist-notes-card">
      <p id="rr-therapist-notes-title">Indicaciones del fisio</p>
      <small>Sesion del {shortDateFormatter.format(new Date(notes.occurredAt))}</small>
      <span>{notes.notes}</span>
    </section>
  );
}

interface TodayOverviewProps {
  /** Every session and closeout of the last 30 days: the week, the goal and the streak. */
  rangeSessions: RehabSession[];
  rangeCloseouts: NightlyCloseout[];
  /** Morning check-ins of the last 30 days, newest first. */
  rangeCheckins: MorningCheckin[];
  recentSessions: RehabSession[];
  /** Notes from the latest physio session; shown until the next one. */
  therapistNotes: LatestTherapistNotes | null;
  goals: RecoveryGoal[];
  user: DisplayNameUser;
}

export function TodayOverview({
  rangeSessions,
  rangeCloseouts,
  rangeCheckins,
  recentSessions,
  therapistNotes,
  goals,
  user,
}: TodayOverviewProps) {
  const now = new Date();
  const todayKey = getRecoveryDateKey(now);
  const todayCheckin = rangeCheckins.find((checkin) => checkin.date === todayKey);
  const condition = parseCondition(user.user_metadata?.condition);
  const goal = sessionGoalFromMetadata(user.user_metadata);
  const dayProgress = getDayProgress(rangeSessions, todayKey, goal);
  const weekProgress = getWeekProgress(rangeSessions, goal, now);
  const state = getTodayRitualState({
    day: dayProgress,
    week: weekProgress,
    hasCheckinToday: Boolean(todayCheckin),
    areaPhrase: conditionAreaPhrase(condition),
  });
  const conditionLine = conditionSummary(condition, todayKey);
  const week = buildRecentWeek(weekProgress, now);
  const streak = calculateLoggingStreak(rangeSessions, rangeCloseouts, now, rangeCheckins);
  const loggedDays = Math.min(
    30,
    new Set([
      ...rangeSessions.map((session) => getRecoveryDateKey(session.occurredAt)),
      ...rangeCloseouts.map((closeout) => closeout.date),
      ...rangeCheckins.map((checkin) => checkin.date),
    ]).size,
  );
  const milestoneProgress = Math.round((loggedDays / 30) * 100);
  const latestSession = recentSessions[0];
  const latestCheckin = rangeCheckins[0];
  const firstName = getUserDisplayName(user) ?? "Tu";

  return (
    <div className="rr-today">
      <header className="rr-today-header">
        <div>
          <p className="rr-kicker">{capitalize(dateFormatter.format(now))}</p>
          <h1 className="rr-page-title">Hola, {firstName}</h1>
          {conditionLine ? <p className="rr-today-condition">{conditionLine}</p> : null}
        </div>
        <Link aria-label="Ajustes" className="rr-mobile-avatar" href="/ajustes">
          <span aria-hidden="true">{firstName.charAt(0)}</span>
        </Link>
        <div className="rr-desktop-week">
          <WeekStrip days={week} />
          <p className="rr-week-goal">{weekGoalLine(weekProgress)}</p>
        </div>
      </header>

      <section className="rr-mobile-momentum">
        <WeekStrip days={week} />
        <p>
          <strong>{weekGoalLine(weekProgress)}</strong> {streak} días seguidos con registro.
        </p>
      </section>

      <div className="rr-today-layout">
        <section className="rr-today-hero rr-card rr-card--hero">
          <div className="rr-hero-heading">
            <ProgressRing progress={state.progress} />
            <div>
              <p>{state.eyebrow}</p>
              <h2>{state.title}</h2>
              <span>{state.body}</span>
            </div>
          </div>

          <div className="rr-ritual-list">
            <article className={dayProgress.met ? "is-complete" : "is-current"}>
              <span className="rr-ritual-dot">{dayProgress.met ? "✓" : ""}</span>
              <div>
                <strong>
                  {dayProgress.perDay === 1
                    ? "Sesión de hoy"
                    : `${dayProgress.perDay} sesiones hoy`}
                </strong>
                <small>Meta: {formatSessionGoal(goal)}</small>
              </div>
              <b>
                {dayProgress.met
                  ? "Hecho"
                  : dayProgress.perDay === 1
                    ? "Ahora"
                    : `${dayProgress.count} de ${dayProgress.perDay}`}
              </b>
            </article>

            <article className={todayCheckin ? "is-complete" : "is-pending"}>
              <span className="rr-ritual-dot">{todayCheckin ? "✓" : ""}</span>
              <div>
                <strong>Cómo amaneciste</strong>
                <small>Opcional · sueño, dolor y rigidez</small>
              </div>
              <b>{todayCheckin ? "Hecho" : "1 min"}</b>
            </article>
          </div>

          <div className="rr-hero-actions">
            <Link className="rr-button rr-button--primary" href={state.primaryHref}>
              <span>{state.primaryLabel}</span>
              <span>
                <small>{state.primaryMeta}</small>
                <b aria-hidden="true">→</b>
              </span>
            </Link>
            <Link className="rr-button rr-button--secondary" href={state.secondaryHref}>
              {state.secondaryLabel}
            </Link>
          </div>
        </section>

        <aside className="rr-today-rail">
          {todayCheckin ? null : (
            <PreviewLink
              glyph="☀"
              href="/registrar?mode=morning"
              subtitle="Sueño, dolor y rigidez al despertar · 1 min"
              title="¿Cómo amaneciste?"
            />
          )}

          {therapistNotes ? <TherapistNotesCard notes={therapistNotes} /> : null}

          <GoalsCard goals={goals} />

          <section className="rr-milestone-card">
            <div>
              <strong>Proximo hito: 30 dias de registro</strong>
              <b>{30 - loggedDays} dias</b>
            </div>
            <span>
              <i style={{ width: `${milestoneProgress}%` }} />
            </span>
            <p>{loggedDays} de 30 dias recientes con actividad registrada</p>
          </section>

          <section className="rr-recent-card">
            <p>Lo mas reciente</p>
            <article>
              <small>Ultima sesion</small>
              <strong>
                {latestSession
                  ? shortDateFormatter.format(new Date(latestSession.occurredAt))
                  : "Sin sesiones"}
              </strong>
              <span>
                {latestSession
                  ? `${latestSession.exercises.length} ejercicios${
                      latestSession.treatments.length > 0
                        ? ` · ${formatTreatmentCount(latestSession.treatments.length)}`
                        : ""
                    } · dolor ${latestSession.painAfter}/10`
                  : "Tu primera sesion aparecera aqui."}
              </span>
            </article>
            <article>
              <small>Última mañana</small>
              <strong>
                {latestCheckin
                  ? shortDateFormatter.format(new Date(`${latestCheckin.date}T00:00:00`))
                  : "Sin registros"}
              </strong>
              <span>
                {latestCheckin
                  ? `Dormiste ${formatHours(latestCheckin.sleepHours)} h · dolor ${latestCheckin.wakingPain}/10 · ${stiffnessLabels[latestCheckin.stiffnessLevel]}`
                  : "Cuéntanos cómo amaneciste y aparecerá aquí."}
              </span>
            </article>
          </section>

          <PreviewLink
            glyph="IN"
            href="/insights"
            subtitle="Revisa dolor, carga, sueno y rebote"
            title="Insights"
          />
          <PreviewLink
            glyph="RP"
            href="/reporte"
            subtitle="Prepara una conversacion con tu especialista"
            title="Reporte para consulta"
          />
        </aside>
      </div>

      <footer className="rr-today-footer">Un dia a la vez. Vas bien.</footer>
    </div>
  );
}
