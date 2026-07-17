import {
  addRecoveryDays,
  getRecoveryDateKey,
} from "@/lib/recovery-date";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

export interface HistoryWindow {
  from: string;
  to: string;
  previousTo: string;
}

export interface HistoryDay {
  date: string;
  sessions: RehabSession[];
  closeout?: NightlyCloseout;
}

export function getHistoryDaySummary(day: HistoryDay) {
  const sessionCount = day.sessions.length;
  const exerciseCount = day.sessions.reduce(
    (total, session) => total + session.exercises.length,
    0,
  );

  return `${sessionCount} sesion${sessionCount === 1 ? "" : "es"} · ${exerciseCount} ejercicio${exerciseCount === 1 ? "" : "s"} · ${day.closeout ? "cierre listo" : "sin cierre"}`;
}

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function getHistoryWindow(
  requestedEnd?: string,
  now: Date = new Date(),
): HistoryWindow {
  const today = getRecoveryDateKey(now);
  const to = requestedEnd && isDateKey(requestedEnd) && requestedEnd <= today
    ? requestedEnd
    : today;
  const from = addRecoveryDays(to, -29);

  return {
    from,
    to,
    previousTo: addRecoveryDays(from, -1),
  };
}

export function buildHistoryDays(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
): HistoryDay[] {
  const days = new Map<string, HistoryDay>();

  for (const session of sessions) {
    const date = getRecoveryDateKey(session.occurredAt);
    const day = days.get(date) ?? { date, sessions: [] };
    day.sessions.push(session);
    days.set(date, day);
  }

  for (const closeout of closeouts) {
    const day = days.get(closeout.date) ?? { date: closeout.date, sessions: [] };
    day.closeout = closeout;
    days.set(closeout.date, day);
  }

  return Array.from(days.values())
    .map((day) => ({
      ...day,
      sessions: day.sessions.toSorted((left, right) =>
        left.occurredAt.localeCompare(right.occurredAt)),
    }))
    .toSorted((left, right) => right.date.localeCompare(left.date));
}
