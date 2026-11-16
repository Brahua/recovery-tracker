import type { DailySignal } from "@/lib/daily-signals";
import {
  filterSessionsByRange,
  filterSignalsByRange,
  getDateRangeForLastDays,
} from "@/lib/recovery-calculations";
import { createMedicalReportSummary, type MedicalReportSummary } from "@/lib/recovery-insights";
import { calculateTreatmentFrequency, type TreatmentFrequencyItem } from "@/lib/treatment-insights";
import type { RehabSession } from "@/types/recovery";
import { getRecoveryDateKey } from "@/lib/recovery-date";
import { formatSessionGoal, type SessionGoal } from "@/lib/session-goal";
import { getWeeklyAdherence } from "@/lib/session-goal-progress";

export interface ReportNote {
  date: string;
  source: "Cierre nocturno" | "Registro de la mañana" | "Sesion" | "Indicaciones del fisio";
  text: string;
}

export interface ReportViewModel {
  summary: MedicalReportSummary;
  recordCount: number;
  sessionCount: number;
  improvedSessionCount: number;
  averageSessionPainDelta?: number;
  averageSleepHours?: number;
  averageEnergy?: number;
  physioSessionCount: number;
  treatments: TreatmentFrequencyItem[];
  notes: ReportNote[];
  /** Full weeks of the range that met the session goal; absent without a full week. */
  adherence?: { goalText: string; weeks: number; metWeeks: number };
}

function average(values: number[]) {
  if (values.length === 0) return undefined;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

export function createReportViewModel(
  sessions: RehabSession[],
  signals: DailySignal[],
  windowDays: number,
  referenceDate?: Date | string,
  sessionGoal?: SessionGoal,
): ReportViewModel {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const weekly = sessionGoal
    ? getWeeklyAdherence(
        sessions,
        sessionGoal,
        range.from,
        range.to,
        getRecoveryDateKey(referenceDate ?? new Date()),
      )
    : null;
  const filteredSessions = filterSessionsByRange(sessions, range);
  const filteredSignals = filterSignalsByRange(signals, range);
  const notes: ReportNote[] = [
    ...filteredSignals.flatMap((signal) =>
      signal.notes?.trim()
        ? [
            {
              date: signal.date,
              source:
                signal.source === "morning"
                  ? ("Registro de la mañana" as const)
                  : ("Cierre nocturno" as const),
              text: signal.notes,
            },
          ]
        : [],
    ),
    ...filteredSessions.flatMap((session) =>
      session.notes?.trim()
        ? [
            {
              date: getRecoveryDateKey(session.occurredAt),
              source: "Sesion" as const,
              text: session.notes,
            },
          ]
        : [],
    ),
    ...filteredSessions.flatMap((session) =>
      session.therapistNotes?.trim()
        ? [
            {
              date: getRecoveryDateKey(session.occurredAt),
              source: "Indicaciones del fisio" as const,
              text: session.therapistNotes,
            },
          ]
        : [],
    ),
  ]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4);

  return {
    summary: createMedicalReportSummary(sessions, signals, windowDays, referenceDate),
    recordCount: filteredSignals.length,
    sessionCount: filteredSessions.length,
    improvedSessionCount: filteredSessions.filter((session) => session.finalState === "BETTER")
      .length,
    averageSessionPainDelta: average(
      filteredSessions.map((session) => session.painAfter - session.painBefore),
    ),
    averageSleepHours: average(filteredSignals.map((signal) => signal.sleepHours)),
    // Energy only exists in older nightly closeouts.
    averageEnergy: average(
      filteredSignals.flatMap((signal) => (signal.energy === undefined ? [] : [signal.energy])),
    ),
    physioSessionCount: filteredSessions.filter(
      (session) => session.sessionType === "PHYSIOTHERAPY",
    ).length,
    treatments: calculateTreatmentFrequency(filteredSessions),
    notes,
    ...(sessionGoal && weekly && weekly.weeks > 0
      ? { adherence: { goalText: formatSessionGoal(sessionGoal), ...weekly } }
      : {}),
  };
}
