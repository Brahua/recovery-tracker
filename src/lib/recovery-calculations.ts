import { normalizeExerciseName } from "@/lib/exercise-name";
import { hasRebound, type DailySignal } from "@/lib/daily-signals";
import type { RehabSession, ReboundLevel } from "@/types/recovery";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

export type TrendDirection = "UP" | "DOWN" | "STABLE" | "NO_DATA";
export type SleepPainRelationship =
  "HIGHER_AFTER_LOW_SLEEP" | "LOWER_AFTER_LOW_SLEEP" | "NO_CLEAR_PATTERN" | "INSUFFICIENT_DATA";

export interface DateRangeWindow {
  from: string;
  to: string;
}

export interface PainTrendPoint {
  date: string;
  pain: number;
}

export interface PainTrendSummary {
  windowDays: number;
  sampleCount: number;
  averagePain?: number;
  startAverage?: number;
  endAverage?: number;
  delta?: number;
  direction: TrendDirection;
  points: PainTrendPoint[];
}

export interface WeeklyLoadSummary {
  windowDays: number;
  sessionCount: number;
  totalLoad: number;
  averageLoad?: number;
}

export interface ReboundSummary {
  windowDays: number;
  sessionCount: number;
  /** Signals in the window that answered the rebound question. */
  closeoutCount: number;
  reboundCount: number;
  strongReboundCount: number;
  reboundRate?: number;
  latestReboundLevel?: ReboundLevel;
}

export interface SleepPainSummary {
  windowDays: number;
  sampleCount: number;
  lowSleepCount: number;
  adequateSleepCount: number;
  lowSleepPainAverage?: number;
  adequateSleepPainAverage?: number;
  painDelta?: number;
  relationship: SleepPainRelationship;
}

export interface ExerciseFrequency {
  name: string;
  count: number;
}

function average(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundToOneDecimal(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Number(value.toFixed(1));
}

function getSessionDateKey(session: RehabSession) {
  return getRecoveryDateKey(session.occurredAt);
}

function inRange(dateKey: string, range: DateRangeWindow) {
  return dateKey >= range.from && dateKey <= range.to;
}

export function getDateRangeForLastDays(
  days: number,
  referenceDate?: Date | string,
): DateRangeWindow {
  const end = getRecoveryDateKey(referenceDate ?? new Date());

  return {
    from: addRecoveryDays(end, -(days - 1)),
    to: end,
  };
}

export function filterSessionsByRange(sessions: RehabSession[], range: DateRangeWindow) {
  return sessions.filter((session) => inRange(getSessionDateKey(session), range));
}

export function filterSignalsByRange(signals: DailySignal[], range: DateRangeWindow) {
  return signals.filter((signal) => inRange(signal.date, range));
}

export function calculatePainTrend(
  signals: DailySignal[],
  windowDays: number,
  referenceDate?: Date | string,
): PainTrendSummary {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filtered = filterSignalsByRange(signals, range).sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const points = filtered.map((signal) => ({
    date: signal.date,
    pain: signal.pain,
  }));

  if (points.length === 0) {
    return {
      windowDays,
      sampleCount: 0,
      direction: "NO_DATA",
      points,
    };
  }

  const midpoint = Math.ceil(points.length / 2);
  const firstHalf = points.slice(0, midpoint).map((point) => point.pain);
  const secondHalf = points.slice(midpoint).map((point) => point.pain);
  const fallbackHalf = points.map((point) => point.pain);
  const startAverage = average(firstHalf) ?? average(fallbackHalf);
  const endAverage = average(secondHalf) ?? average(fallbackHalf);
  const delta =
    typeof startAverage === "number" && typeof endAverage === "number"
      ? endAverage - startAverage
      : undefined;
  const direction =
    typeof delta !== "number" ? "NO_DATA" : delta >= 1 ? "UP" : delta <= -1 ? "DOWN" : "STABLE";

  return {
    windowDays,
    sampleCount: points.length,
    averagePain: roundToOneDecimal(average(points.map((point) => point.pain))),
    startAverage: roundToOneDecimal(startAverage),
    endAverage: roundToOneDecimal(endAverage),
    delta: roundToOneDecimal(delta),
    direction,
    points,
  };
}

export function calculateWeeklyLoad(
  sessions: RehabSession[],
  windowDays = 7,
  referenceDate?: Date | string,
): WeeklyLoadSummary {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filtered = filterSessionsByRange(sessions, range);
  const totalLoad = filtered.reduce((total, session) => total + session.perceivedLoad, 0);

  return {
    windowDays,
    sessionCount: filtered.length,
    totalLoad,
    averageLoad: roundToOneDecimal(filtered.length > 0 ? totalLoad / filtered.length : undefined),
  };
}

export function calculateReboundSummary(
  sessions: RehabSession[],
  signals: DailySignal[],
  windowDays = 7,
  referenceDate?: Date | string,
): ReboundSummary {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const recentSessions = filterSessionsByRange(sessions, range);
  // A rebound belongs to the day of the sessions it answers to (the day before, for a morning).
  const answered = signals
    .filter((signal) => signal.rebound !== undefined && inRange(signal.reboundDate ?? "", range))
    .sort((left, right) => (right.reboundDate ?? "").localeCompare(left.reboundDate ?? ""));
  const withRebound = answered.filter(hasRebound);

  return {
    windowDays,
    sessionCount: recentSessions.length,
    closeoutCount: answered.length,
    reboundCount: withRebound.length,
    strongReboundCount: withRebound.filter((signal) => signal.rebound === "STRONG").length,
    reboundRate: roundToOneDecimal(
      recentSessions.length > 0 ? withRebound.length / recentSessions.length : undefined,
    ),
    latestReboundLevel: answered[0]?.rebound,
  };
}

export function calculateSleepPainComparison(
  signals: DailySignal[],
  windowDays = 14,
  referenceDate?: Date | string,
): SleepPainSummary {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  // Each signal pairs a night with the pain that followed it (on waking, or at the end of an older
  // closeout's day).
  const filtered = filterSignalsByRange(signals, range);
  const lowSleep = filtered.filter((signal) => signal.sleepHours < 6);
  const adequateSleep = filtered.filter((signal) => signal.sleepHours >= 6);
  const lowSleepPainAverage = average(lowSleep.map((signal) => signal.pain));
  const adequateSleepPainAverage = average(adequateSleep.map((signal) => signal.pain));
  const painDelta =
    typeof lowSleepPainAverage === "number" && typeof adequateSleepPainAverage === "number"
      ? lowSleepPainAverage - adequateSleepPainAverage
      : undefined;
  const relationship =
    typeof painDelta !== "number"
      ? "INSUFFICIENT_DATA"
      : painDelta >= 1
        ? "HIGHER_AFTER_LOW_SLEEP"
        : painDelta <= -1
          ? "LOWER_AFTER_LOW_SLEEP"
          : "NO_CLEAR_PATTERN";

  return {
    windowDays,
    sampleCount: filtered.length,
    lowSleepCount: lowSleep.length,
    adequateSleepCount: adequateSleep.length,
    lowSleepPainAverage: roundToOneDecimal(lowSleepPainAverage),
    adequateSleepPainAverage: roundToOneDecimal(adequateSleepPainAverage),
    painDelta: roundToOneDecimal(painDelta),
    relationship,
  };
}

export function calculateRecentExerciseFrequency(
  sessions: RehabSession[],
  windowDays = 30,
  referenceDate?: Date | string,
): ExerciseFrequency[] {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filtered = filterSessionsByRange(sessions, range);
  // Catalog exercises count as one even if renamed or merged; the most recent name is shown.
  const counts = new Map<string, { name: string; count: number; lastSeen: number }>();

  for (const session of filtered) {
    const occurredAt = new Date(session.occurredAt).getTime();
    const keys = new Set<string>();

    for (const exercise of session.exercises) {
      const key = exercise.exerciseId ?? `name:${normalizeExerciseName(exercise.name)}`;
      if (keys.has(key)) continue;
      keys.add(key);

      const current = counts.get(key);
      counts.set(key, {
        name: !current || occurredAt >= current.lastSeen ? exercise.name : current.name,
        count: (current?.count ?? 0) + 1,
        lastSeen: Math.max(current?.lastSeen ?? occurredAt, occurredAt),
      });
    }
  }

  return [...counts.values()]
    .map(({ name, count }) => ({ name, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.name.localeCompare(right.name);
    });
}
