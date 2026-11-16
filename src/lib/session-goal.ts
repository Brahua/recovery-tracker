// The session goal of an account (docs/specs/morning-checkin-and-daily-goal-spec.md): how many
// sessions make a day "done" and on how many days a week. It lives in user_metadata.session_goal
// (its own key: saving the appearance replaces user_metadata.preferences as a whole), so every
// page already has it with the user and it needs no query.

export const SESSION_GOAL_PER_DAY_MIN = 1;
export const SESSION_GOAL_PER_DAY_MAX = 5;
export const SESSION_GOAL_DAYS_MIN = 1;
export const SESSION_GOAL_DAYS_MAX = 7;

export interface SessionGoal {
  /** Sessions that make a day done (1–5). */
  perDay: number;
  /** Done days that make a week done (1–7, Monday to Sunday). */
  daysPerWeek: number;
}

export const defaultSessionGoal: SessionGoal = { perDay: 1, daysPerWeek: 7 };

export const sessionGoalPerDayOptions = range(SESSION_GOAL_PER_DAY_MIN, SESSION_GOAL_PER_DAY_MAX);
export const sessionGoalDaysOptions = range(SESSION_GOAL_DAYS_MIN, SESSION_GOAL_DAYS_MAX);

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function isIntegerBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/** Reads user_metadata.session_goal. Each invalid or missing part falls back to the default. */
export function parseSessionGoal(raw: unknown): SessionGoal {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    perDay: isIntegerBetween(value.perDay, SESSION_GOAL_PER_DAY_MIN, SESSION_GOAL_PER_DAY_MAX)
      ? value.perDay
      : defaultSessionGoal.perDay,
    daysPerWeek: isIntegerBetween(value.daysPerWeek, SESSION_GOAL_DAYS_MIN, SESSION_GOAL_DAYS_MAX)
      ? value.daysPerWeek
      : defaultSessionGoal.daysPerWeek,
  };
}

export function sessionGoalFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  return parseSessionGoal(metadata?.session_goal);
}

export function formatSessionsPerDay(perDay: number) {
  return perDay === 1 ? "1 sesión al día" : `${perDay} sesiones al día`;
}

export function formatDaysPerWeek(daysPerWeek: number) {
  if (daysPerWeek === 7) return "todos los días";
  return daysPerWeek === 1 ? "1 día a la semana" : `${daysPerWeek} días a la semana`;
}

/** "2 sesiones al día, 5 días a la semana" · "1 sesión al día, todos los días". */
export function formatSessionGoal(goal: SessionGoal) {
  return `${formatSessionsPerDay(goal.perDay)}, ${formatDaysPerWeek(goal.daysPerWeek)}`;
}
