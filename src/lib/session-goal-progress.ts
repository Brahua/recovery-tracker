import { addRecoveryDays, getRecoveryDateKey, getRecoveryWeekKeys } from "@/lib/recovery-date";
import type { SessionGoal } from "@/lib/session-goal";
import type { RehabSession } from "@/types/recovery";

// Progress against the session goal (docs/specs/morning-checkin-and-daily-goal-spec.md). A day is
// done with goal.perDay sessions; a week (Monday to Sunday, Lima) with goal.daysPerWeek done days.

export type GoalDayStatus = "full" | "partial" | "empty";

export interface DayProgress {
  date: string;
  count: number;
  perDay: number;
  met: boolean;
  status: GoalDayStatus;
}

export interface WeekProgress {
  days: DayProgress[];
  metDays: number;
  daysPerWeek: number;
  weekMet: boolean;
}

/** Sessions per Lima day ("YYYY-MM-DD" → count). */
export function countSessionsByDay(sessions: Pick<RehabSession, "occurredAt">[]) {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = getRecoveryDateKey(session.occurredAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function dayProgress(date: string, count: number, goal: SessionGoal): DayProgress {
  const met = count >= goal.perDay;
  return {
    date,
    count,
    perDay: goal.perDay,
    met,
    status: met ? "full" : count > 0 ? "partial" : "empty",
  };
}

export function getDayProgress(
  sessions: Pick<RehabSession, "occurredAt">[],
  date: string,
  goal: SessionGoal,
): DayProgress {
  return dayProgress(date, countSessionsByDay(sessions).get(date) ?? 0, goal);
}

/** The week (Monday to Sunday, Lima) that contains `now`. */
export function getWeekProgress(
  sessions: Pick<RehabSession, "occurredAt">[],
  goal: SessionGoal,
  now: Date | string = new Date(),
): WeekProgress {
  const counts = countSessionsByDay(sessions);
  const days = getRecoveryWeekKeys(now).map((date) =>
    dayProgress(date, counts.get(date) ?? 0, goal),
  );
  const metDays = days.filter((day) => day.met).length;
  return { days, metDays, daysPerWeek: goal.daysPerWeek, weekMet: metDays >= goal.daysPerWeek };
}

/**
 * Weeks fully inside [from, to] (Monday to Sunday) and how many met the goal. The week that holds
 * `today` is left out while it is still running.
 */
export function getWeeklyAdherence(
  sessions: Pick<RehabSession, "occurredAt">[],
  goal: SessionGoal,
  from: string,
  to: string,
  today: string = getRecoveryDateKey(),
) {
  const counts = countSessionsByDay(sessions);
  let weeks = 0;
  let metWeeks = 0;
  // Monday of the first week that starts on or after `from`.
  let monday = getRecoveryWeekKeys(from)[0];
  if (monday < from) monday = getRecoveryWeekKeys(addRecoveryDays(monday, 7))[0];

  while (true) {
    const days = getRecoveryWeekKeys(monday);
    const sunday = days[6];
    if (sunday > to || sunday >= today) break;
    weeks += 1;
    const metDays = days.filter((day) => (counts.get(day) ?? 0) >= goal.perDay).length;
    if (metDays >= goal.daysPerWeek) metWeeks += 1;
    monday = addRecoveryDays(monday, 7);
  }

  return { weeks, metWeeks };
}
