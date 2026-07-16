import type { NightlyCloseout, RehabSession } from "@/types/recovery";
import {
  addRecoveryDays,
  getRecoveryDateKey,
  getRecoveryWeekKeys,
} from "@/lib/recovery-date";

const weekdayInitials = ["D", "L", "M", "X", "J", "V", "S"] as const;

function dateKey(value: Date) {
  return getRecoveryDateKey(value);
}

function sessionDateKey(session: RehabSession) {
  return getRecoveryDateKey(session.occurredAt);
}

function buildLoggedDayKeys(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
) {
  return new Set([
    ...sessions.map(sessionDateKey),
    ...closeouts.map((closeout) => closeout.date),
  ]);
}

export interface TodayRitualState {
  progress: 0 | 50 | 100;
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  primaryMeta: string;
  secondaryHref: string;
  secondaryLabel: string;
}

export function getTodayRitualState(
  hasSessionToday: boolean,
  hasCloseoutToday: boolean,
): TodayRitualState {
  if (!hasSessionToday) {
    return {
      progress: 0,
      eyebrow: "Siguiente paso",
      title: "Te toca la sesion de hoy",
      body: "Un paso mas cerca de tu rodilla de antes.",
      primaryHref: "/registrar?mode=session",
      primaryLabel: "Empezar sesion de hoy",
      primaryMeta: "20 min",
      secondaryHref: "/registrar?mode=closeout",
      secondaryLabel: "Hacer cierre nocturno",
    };
  }

  if (!hasCloseoutToday) {
    return {
      progress: 50,
      eyebrow: "Buen avance",
      title: "Sesion hecha. Bien ahi.",
      body: "Esta noche cierras el dia en 1 minuto.",
      primaryHref: "/registrar?mode=closeout",
      primaryLabel: "Hacer cierre nocturno",
      primaryMeta: "1 min",
      secondaryHref: "/registrar?mode=session",
      secondaryLabel: "Ver sesion completada",
    };
  }

  return {
    progress: 100,
    eyebrow: "Dia completo",
    title: "Dia cerrado. Ya hiciste lo importante.",
    body: "Tus dos rituales quedaron guardados.",
    primaryHref: "/insights",
    primaryLabel: "Ver insights",
    primaryMeta: "Ahora",
    secondaryHref: "/reporte",
    secondaryLabel: "Preparar reporte",
  };
}

export interface RecentWeekDay {
  key: string;
  label: string;
  completed: boolean;
  isToday: boolean;
}

export function buildRecentWeek(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
  now = new Date(),
): RecentWeekDay[] {
  const loggedDayKeys = buildLoggedDayKeys(sessions, closeouts);
  const today = dateKey(now);
  return getRecoveryWeekKeys(now).map((key) => {
    const value = new Date(`${key}T00:00:00.000Z`);

    return {
      key,
      label: weekdayInitials[value.getUTCDay()],
      completed: loggedDayKeys.has(key),
      isToday: key === today,
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
