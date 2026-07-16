import Link from "next/link";

import {
  buildRecentWeek,
  calculateLoggingStreak,
  getTodayRitualState,
  type RecentWeekDay,
} from "@/lib/today-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";
import { getRecoveryDateKey, recoveryTimeZone } from "@/lib/recovery-date";

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

const reboundLabels: Record<NightlyCloseout["reboundPainLevel"], string> = {
  NONE: "sin rebote",
  MILD: "rebote leve",
  MODERATE: "rebote moderado",
  STRONG: "rebote fuerte",
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getFirstName(email?: string | null) {
  const localPart = email?.trim().split("@")[0] || "tu";
  const firstName = localPart.split(/[._-]/)[0] ?? localPart;
  return capitalize(firstName);
}

function sessionDateKey(session: RehabSession) {
  return getRecoveryDateKey(session.occurredAt);
}

function WeekStrip({ days }: { days: RecentWeekDay[] }) {
  return (
    <div className="rr-week" aria-label="Semana actual, de lunes a domingo">
      {days.map((day) => (
        <div className="rr-week-day" key={day.key}>
          <span
            className={`rr-week-mark ${day.completed ? "is-complete" : ""} ${
              day.isToday ? "is-today" : ""
            }`}
          >
            {day.completed ? "✓" : day.isToday ? "·" : ""}
          </span>
          <span className={day.isToday ? "is-today" : ""}>
            {day.isToday ? "Hoy" : day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressRing({ progress }: { progress: 0 | 50 | 100 }) {
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
        <strong>{progress}</strong><small>%</small>
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

interface TodayOverviewProps {
  recentSessions: RehabSession[];
  recentCloseouts: NightlyCloseout[];
  userEmail?: string | null;
}

export function TodayOverview({
  recentSessions,
  recentCloseouts,
  userEmail,
}: TodayOverviewProps) {
  const now = new Date();
  const todayKey = getRecoveryDateKey(now);
  const hasSessionToday = recentSessions.some(
    (session) => sessionDateKey(session) === todayKey,
  );
  const hasCloseoutToday = recentCloseouts.some(
    (closeout) => closeout.date === todayKey,
  );
  const state = getTodayRitualState(hasSessionToday, hasCloseoutToday);
  const week = buildRecentWeek(recentSessions, recentCloseouts, now);
  const streak = calculateLoggingStreak(recentSessions, recentCloseouts, now);
  const loggedDays = week.filter((day) => day.completed).length;
  const milestoneProgress = Math.round((loggedDays / 30) * 100);
  const latestSession = recentSessions[0];
  const latestCloseout = recentCloseouts[0];
  const firstName = getFirstName(userEmail);

  return (
    <div className="rr-today">
      <header className="rr-today-header">
        <div>
          <p>{capitalize(dateFormatter.format(now))}</p>
          <h1>Hola, {firstName}</h1>
        </div>
        <span className="rr-mobile-avatar" aria-hidden="true">
          {firstName.charAt(0)}
        </span>
        <div className="rr-desktop-week">
          <WeekStrip days={week} />
        </div>
      </header>

      <section className="rr-mobile-momentum">
        <WeekStrip days={week} />
        <p>
          <strong>{streak} dias seguidos.</strong> La constancia tambien cuenta.
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
            <article className={hasSessionToday ? "is-complete" : "is-current"}>
              <span className="rr-ritual-dot">{hasSessionToday ? "✓" : ""}</span>
              <div>
                <strong>Sesion de ejercicios</strong>
                <small>
                  {hasSessionToday
                    ? "Completada hoy"
                    : "Registra dolor, carga y ejercicios"}
                </small>
              </div>
              <b>{hasSessionToday ? "Hecha" : "Ahora"}</b>
            </article>

            <article className={hasCloseoutToday ? "is-complete" : "is-pending"}>
              <span className="rr-ritual-dot">{hasCloseoutToday ? "✓" : ""}</span>
              <div>
                <strong>Cierre nocturno</strong>
                <small>Dolor, energia, sueno y rebote</small>
              </div>
              <b>{hasCloseoutToday ? "Hecho" : "Esta noche"}</b>
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
            <Link
              className="rr-button rr-button--secondary"
              href={state.secondaryHref}
            >
              {state.secondaryLabel}
            </Link>
          </div>
        </section>

        <aside className="rr-today-rail">
          <section className="rr-milestone-card">
            <div>
              <strong>Proximo hito: 30 dias de registro</strong>
              <b>{30 - loggedDays} dias</b>
            </div>
            <span><i style={{ width: `${milestoneProgress}%` }} /></span>
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
                  ? `${latestSession.exercises.length} ejercicios · dolor ${latestSession.painAfter}/10`
                  : "Tu primera sesion aparecera aqui."}
              </span>
            </article>
            <article>
              <small>Ultimo cierre</small>
              <strong>
                {latestCloseout
                  ? shortDateFormatter.format(new Date(`${latestCloseout.date}T00:00:00`))
                  : "Sin cierres"}
              </strong>
              <span>
                {latestCloseout
                  ? `Dolor ${latestCloseout.endOfDayPain}/10 · ${reboundLabels[latestCloseout.reboundPainLevel]}`
                  : "Tu primer cierre aparecera aqui."}
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
