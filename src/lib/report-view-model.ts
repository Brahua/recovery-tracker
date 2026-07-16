import {
  filterCloseoutsByRange,
  filterSessionsByRange,
  getDateRangeForLastDays,
} from "@/lib/recovery-calculations";
import {
  createMedicalReportSummary,
  type MedicalReportSummary,
} from "@/lib/recovery-insights";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";
import { getRecoveryDateKey } from "@/lib/recovery-date";

export interface ReportNote {
  date: string;
  source: "Cierre nocturno" | "Sesion";
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
  notes: ReportNote[];
}

function average(values: number[]) {
  if (values.length === 0) return undefined;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

export function createReportViewModel(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
  windowDays: number,
  referenceDate?: Date | string,
): ReportViewModel {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filteredSessions = filterSessionsByRange(sessions, range);
  const filteredCloseouts = filterCloseoutsByRange(closeouts, range);
  const notes: ReportNote[] = [
    ...filteredCloseouts.flatMap((closeout) =>
      closeout.notes?.trim()
        ? [{ date: closeout.date, source: "Cierre nocturno" as const, text: closeout.notes }]
        : [],
    ),
    ...filteredSessions.flatMap((session) =>
      session.notes?.trim()
        ? [{ date: getRecoveryDateKey(session.occurredAt), source: "Sesion" as const, text: session.notes }]
        : [],
    ),
  ]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4);

  return {
    summary: createMedicalReportSummary(
      sessions,
      closeouts,
      windowDays,
      referenceDate,
    ),
    recordCount: filteredCloseouts.length,
    sessionCount: filteredSessions.length,
    improvedSessionCount: filteredSessions.filter(
      (session) => session.finalState === "BETTER",
    ).length,
    averageSessionPainDelta: average(
      filteredSessions.map((session) => session.painAfter - session.painBefore),
    ),
    averageSleepHours: average(
      filteredCloseouts.map((closeout) => closeout.sleepHours),
    ),
    averageEnergy: average(filteredCloseouts.map((closeout) => closeout.energy)),
    notes,
  };
}
