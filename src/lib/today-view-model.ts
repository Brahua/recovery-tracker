import type { NightlyCloseout, RehabSession } from "@/types/recovery";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";
import type { DayProgress, GoalDayStatus, WeekProgress } from "@/lib/session-goal-progress";

const weekdayInitials = ["D", "L", "M", "X", "J", "V", "S"] as const;

function dateKey(value: Date) {
  return getRecoveryDateKey(value);
}

function sessionDateKey(session: RehabSession) {
  return getRecoveryDateKey(session.occurredAt);
}

function buildLoggedDayKeys(sessions: RehabSession[], closeouts: NightlyCloseout[]) {
  return new Set([...sessions.map(sessionDateKey), ...closeouts.map((closeout) => closeout.date)]);
}

export interface TodayRitualState {
  /** Share of today's session goal, 0–100. */
  progress: number;
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  primaryMeta: string;
  secondaryHref: string;
  secondaryLabel: string;
}

interface TodayRitualInput {
  day: DayProgress;
  week: WeekProgress;
  hasCloseoutToday: boolean;
  areaPhrase?: string;
}

const sessionHref = "/registrar?mode=session";
const closeoutHref = "/registrar?mode=closeout";

function sessionsWord(count: number) {
  return count === 1 ? "sesión" : "sesiones";
}

// Today's card follows the session goal (docs/specs/morning-checkin-and-daily-goal-spec.md): the
// day is done with goal.perDay sessions; the nightly closeout is optional.
export function getTodayRitualState({
  day,
  week,
  hasCloseoutToday,
  areaPhrase,
}: TodayRitualInput): TodayRitualState {
  const progress = Math.min(100, Math.round((day.count / day.perDay) * 100));
  const optionalCloseout = hasCloseoutToday
    ? null
    : { secondaryHref: closeoutHref, secondaryLabel: "Hacer cierre (opcional)" };

  if (day.met) {
    return {
      progress: 100,
      eyebrow: "Día completo",
      title:
        day.perDay === 1 && day.count === 1
          ? "Sesión hecha. Día completo."
          : `${day.count} ${sessionsWord(day.count)}. Día completo.`,
      body: week.weekMet
        ? "Semana cumplida. Ya hiciste lo importante."
        : `Llevas ${week.metDays} de ${week.daysPerWeek} días esta semana.`,
      primaryHref: "/insights",
      primaryLabel: "Ver insights",
      primaryMeta: "Ahora",
      ...(optionalCloseout ?? {
        secondaryHref: sessionHref,
        secondaryLabel: "Registrar otra sesión",
      }),
    };
  }

  if (day.count > 0) {
    const missing = day.perDay - day.count;
    return {
      progress,
      eyebrow: "Buen avance",
      title: `Llevas ${day.count} de ${day.perDay} sesiones.`,
      body: `Te ${missing === 1 ? "falta 1 sesión" : `faltan ${missing} sesiones`} para completar el día.`,
      primaryHref: sessionHref,
      primaryLabel: "Registrar otra sesión",
      primaryMeta: "20 min",
      ...(optionalCloseout ?? { secondaryHref: "/insights", secondaryLabel: "Ver insights" }),
    };
  }

  if (week.weekMet) {
    return {
      progress: 0,
      eyebrow: "Semana cumplida",
      title: "Hoy puedes descansar o sumar una sesión.",
      body: `Ya cumpliste ${week.metDays} de ${week.daysPerWeek} días esta semana.`,
      primaryHref: sessionHref,
      primaryLabel: "Registrar una sesión",
      primaryMeta: "20 min",
      ...(optionalCloseout ?? { secondaryHref: "/insights", secondaryLabel: "Ver insights" }),
    };
  }

  return {
    progress: 0,
    eyebrow: "Siguiente paso",
    title: "Te toca la sesión de hoy",
    body: areaPhrase ? `Un paso más para ${areaPhrase}.` : "Un paso más cerca de tu recuperación.",
    primaryHref: sessionHref,
    primaryLabel: "Empezar sesión de hoy",
    primaryMeta: "20 min",
    ...(optionalCloseout ?? { secondaryHref: "/insights", secondaryLabel: "Ver insights" }),
  };
}

export interface RecentWeekDay {
  key: string;
  label: string;
  status: GoalDayStatus;
  isToday: boolean;
}

/** The current week (Monday to Sunday) with each day's status against the session goal. */
export function buildRecentWeek(week: WeekProgress, now = new Date()): RecentWeekDay[] {
  const today = dateKey(now);
  return week.days.map((day) => {
    const value = new Date(`${day.date}T00:00:00.000Z`);

    return {
      key: day.date,
      label: weekdayInitials[value.getUTCDay()],
      status: day.status,
      isToday: day.date === today,
    };
  });
}

export function calculateLoggingStreak(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
  now = new Date(),
) {
  const loggedDayKeys = buildLoggedDayKeys(sessions, closeouts);
  let cursor = dateKey(now);
  let streak = 0;

  while (loggedDayKeys.has(cursor)) {
    streak += 1;
    cursor = addRecoveryDays(cursor, -1);
  }

  return streak;
}
