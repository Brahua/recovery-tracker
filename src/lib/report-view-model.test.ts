import { describe, expect, it } from "vitest";

import { createReportViewModel } from "@/lib/report-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const sessions: RehabSession[] = [
  {
    id: "session-recent",
    occurredAt: "2026-07-15T18:00:00.000Z",
    sessionType: "HOME",
    painBefore: 4,
    painAfter: 2,
    perceivedLoad: 3,
    exercises: [{ name: "TKE", sets: [] }],
    finalState: "BETTER",
    notes: "Mejor control al bajar.",
    createdAt: "2026-07-15T18:10:00.000Z",
    updatedAt: "2026-07-15T18:10:00.000Z",
  },
  {
    id: "session-old",
    occurredAt: "2026-06-01T18:00:00.000Z",
    sessionType: "HOME",
    painBefore: 3,
    painAfter: 3,
    perceivedLoad: 2,
    exercises: [],
    finalState: "SAME",
    createdAt: "2026-06-01T18:10:00.000Z",
    updatedAt: "2026-06-01T18:10:00.000Z",
  },
];

const closeouts: NightlyCloseout[] = [
  {
    id: "closeout-recent",
    date: "2026-07-16",
    endOfDayPain: 3,
    energy: 4,
    sleepHours: 7.5,
    sleepQuality: 4,
    reboundPainLevel: "MILD",
    notes: "Sin rigidez al final del dia.",
    createdAt: "2026-07-16T22:00:00.000Z",
    updatedAt: "2026-07-16T22:00:00.000Z",
  },
  {
    id: "closeout-old",
    date: "2026-06-01",
    endOfDayPain: 6,
    energy: 2,
    sleepHours: 5,
    sleepQuality: 2,
    reboundPainLevel: "MODERATE",
    createdAt: "2026-06-01T22:00:00.000Z",
    updatedAt: "2026-06-01T22:00:00.000Z",
  },
];

describe("createReportViewModel", () => {
  it("derives report metrics only from records inside the selected window", () => {
    const report = createReportViewModel(
      sessions,
      closeouts,
      14,
      "2026-07-16T12:00:00.000Z",
    );

    expect(report.recordCount).toBe(1);
    expect(report.sessionCount).toBe(1);
    expect(report.improvedSessionCount).toBe(1);
    expect(report.averageSessionPainDelta).toBe(-2);
    expect(report.averageSleepHours).toBe(7.5);
    expect(report.averageEnergy).toBe(4);
    expect(report.notes).toEqual([
      {
        date: "2026-07-16",
        source: "Cierre nocturno",
        text: "Sin rigidez al final del dia.",
      },
      {
        date: "2026-07-15",
        source: "Sesion",
        text: "Mejor control al bajar.",
      },
    ]);
  });

  it("returns undefined averages for an empty window", () => {
    const report = createReportViewModel([], [], 7, "2026-07-16T12:00:00.000Z");

    expect(report.averageSessionPainDelta).toBeUndefined();
    expect(report.averageSleepHours).toBeUndefined();
    expect(report.averageEnergy).toBeUndefined();
    expect(report.notes).toEqual([]);
  });
});
