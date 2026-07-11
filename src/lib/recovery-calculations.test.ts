import { describe, expect, it } from "vitest";

import {
  calculatePainTrend,
  calculateRecentExerciseFrequency,
  calculateReboundSummary,
  calculateSleepPainComparison,
  filterCloseoutsByRange,
  filterSessionsByRange,
  calculateWeeklyLoad,
  getDateRangeForLastDays,
} from "@/lib/recovery-calculations";
import {
  buildAppointmentQuestions,
  buildPainTrendInsight,
  buildReboundInsight,
  buildSleepPainInsight,
  buildWeeklyLoadInsight,
  buildWeeklyRecoveryStory,
} from "@/lib/recovery-insights";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const rehabSessions: RehabSession[] = [
  {
    id: "session-1",
    occurredAt: "2026-07-08T18:00:00.000Z",
    sessionType: "HOME",
    painBefore: 4,
    painAfter: 3,
    perceivedLoad: 3,
    exercises: [{ name: "Bicicleta 5-10 min" }, { name: "Step-up" }],
    finalState: "BETTER",
    createdAt: "2026-07-08T18:10:00.000Z",
    updatedAt: "2026-07-08T18:10:00.000Z",
  },
  {
    id: "session-2",
    occurredAt: "2026-07-09T18:00:00.000Z",
    sessionType: "PHYSIOTHERAPY",
    painBefore: 5,
    painAfter: 4,
    perceivedLoad: 4,
    exercises: [{ name: "Step-up" }, { name: "TKE" }],
    finalState: "SAME",
    createdAt: "2026-07-09T18:10:00.000Z",
    updatedAt: "2026-07-09T18:10:00.000Z",
  },
  {
    id: "session-3",
    occurredAt: "2026-07-10T18:00:00.000Z",
    sessionType: "GYM",
    painBefore: 3,
    painAfter: 2,
    perceivedLoad: 2,
    exercises: [{ name: "Bicicleta 5-10 min" }],
    finalState: "BETTER",
    createdAt: "2026-07-10T18:10:00.000Z",
    updatedAt: "2026-07-10T18:10:00.000Z",
  },
];

const nightlyCloseouts: NightlyCloseout[] = [
  {
    id: "closeout-1",
    date: "2026-07-07",
    endOfDayPain: 6,
    energy: 2,
    sleepHours: 5,
    sleepQuality: 2,
    reboundPainLevel: "MODERATE",
    createdAt: "2026-07-07T23:00:00.000Z",
    updatedAt: "2026-07-07T23:00:00.000Z",
  },
  {
    id: "closeout-2",
    date: "2026-07-08",
    endOfDayPain: 5,
    energy: 3,
    sleepHours: 5.5,
    sleepQuality: 3,
    reboundPainLevel: "MILD",
    createdAt: "2026-07-08T23:00:00.000Z",
    updatedAt: "2026-07-08T23:00:00.000Z",
  },
  {
    id: "closeout-3",
    date: "2026-07-09",
    endOfDayPain: 4,
    energy: 4,
    sleepHours: 7.5,
    sleepQuality: 4,
    reboundPainLevel: "NONE",
    createdAt: "2026-07-09T23:00:00.000Z",
    updatedAt: "2026-07-09T23:00:00.000Z",
  },
  {
    id: "closeout-4",
    date: "2026-07-10",
    endOfDayPain: 3,
    energy: 4,
    sleepHours: 8,
    sleepQuality: 4,
    reboundPainLevel: "MILD",
    createdAt: "2026-07-10T23:00:00.000Z",
    updatedAt: "2026-07-10T23:00:00.000Z",
  },
];

describe("recovery calculations", () => {
  it("builds an inclusive date window", () => {
    expect(getDateRangeForLastDays(7, "2026-07-10T12:00:00.000Z")).toEqual({
      from: "2026-07-04",
      to: "2026-07-10",
    });
  });

  it("filters sessions and closeouts inclusively by range", () => {
    const range = { from: "2026-07-08", to: "2026-07-09" };

    expect(filterSessionsByRange(rehabSessions, range).map((session) => session.id)).toEqual([
      "session-1",
      "session-2",
    ]);
    expect(filterCloseoutsByRange(nightlyCloseouts, range).map((closeout) => closeout.id)).toEqual([
      "closeout-2",
      "closeout-3",
    ]);
  });

  it("returns no-data trend for empty closeouts", () => {
    expect(calculatePainTrend([], 7, "2026-07-10T12:00:00.000Z")).toMatchObject({
      sampleCount: 0,
      direction: "NO_DATA",
      points: [],
    });
  });

  it("detects a downward pain trend from closeouts", () => {
    const result = calculatePainTrend(
      nightlyCloseouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(result.direction).toBe("DOWN");
    expect(result.sampleCount).toBe(4);
    expect(result.averagePain).toBe(4.5);
    expect(result.delta).toBe(-2);
  });

  it("summarizes weekly load from recent sessions", () => {
    const result = calculateWeeklyLoad(
      rehabSessions,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(result).toEqual({
      windowDays: 7,
      sessionCount: 3,
      totalLoad: 9,
      averageLoad: 3,
    });
  });

  it("counts rebound and strong rebound separately", () => {
    const result = calculateReboundSummary(
      rehabSessions,
      nightlyCloseouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(result.sessionCount).toBe(3);
    expect(result.reboundCount).toBe(3);
    expect(result.strongReboundCount).toBe(0);
    expect(result.latestReboundLevel).toBe("MILD");
  });

  it("uses the latest closeout date for latest rebound level even if input is unsorted", () => {
    const result = calculateReboundSummary(
      rehabSessions,
      [nightlyCloseouts[1]!, nightlyCloseouts[3]!, nightlyCloseouts[2]!, nightlyCloseouts[0]!],
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(result.latestReboundLevel).toBe("MILD");
  });

  it("compares low sleep against adequate sleep", () => {
    const result = calculateSleepPainComparison(
      nightlyCloseouts,
      14,
      "2026-07-10T12:00:00.000Z",
    );

    expect(result.relationship).toBe("HIGHER_AFTER_LOW_SLEEP");
    expect(result.lowSleepCount).toBe(2);
    expect(result.adequateSleepCount).toBe(2);
    expect(result.painDelta).toBe(2);
  });

  it("counts recent exercises by frequency", () => {
    expect(
      calculateRecentExerciseFrequency(
        rehabSessions,
        30,
        "2026-07-10T12:00:00.000Z",
      ).slice(0, 3),
    ).toEqual([
      { name: "Bicicleta 5-10 min", count: 2 },
      { name: "Step-up", count: 2 },
      { name: "TKE", count: 1 },
    ]);
  });
});

describe("recovery insights", () => {
  it("keeps pain trend insight observational in Spanish", () => {
    const trend = calculatePainTrend(
      nightlyCloseouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(buildPainTrendInsight(trend)).toContain("va bajando");
  });

  it("handles insufficient data without inventing advice", () => {
    const summary = calculateSleepPainComparison(
      [nightlyCloseouts[0]!],
      14,
      "2026-07-10T12:00:00.000Z",
    );

    expect(buildSleepPainInsight(summary)).toContain(
      "Aun no hay suficientes noches",
    );
  });

  it("builds a combined weekly story from the pure summaries", () => {
    const painTrend = calculatePainTrend(
      nightlyCloseouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );
    const weeklyLoad = calculateWeeklyLoad(
      rehabSessions,
      7,
      "2026-07-10T12:00:00.000Z",
    );
    const rebound = calculateReboundSummary(
      rehabSessions,
      nightlyCloseouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );
    const sleepPain = calculateSleepPainComparison(
      nightlyCloseouts,
      14,
      "2026-07-10T12:00:00.000Z",
    );

    const story = buildWeeklyRecoveryStory({
      painTrend,
      weeklyLoad,
      rebound,
      sleepPain,
    });

    expect(story).toContain("El dolor promedio de cierre va bajando");
    expect(story).toContain("El rebote aparecio en 3 de las ultimas 3 sesiones");
    expect(story).toContain("menos de 6 horas");
    expect(story).toContain("carga total de 9 puntos");
  });

  it("covers empty-state insight variants", () => {
    expect(
      buildReboundInsight(
        calculateReboundSummary([], [], 7, "2026-07-10T12:00:00.000Z"),
      ),
    ).toContain("Sin sesiones recientes");
    expect(
      buildWeeklyLoadInsight(
        calculateWeeklyLoad([], 7, "2026-07-10T12:00:00.000Z"),
      ),
    ).toContain("Todavia no hay sesiones recientes");
  });

  it("builds fallback appointment questions when no report signal stands out", () => {
    expect(
      buildAppointmentQuestions({
        windowDays: 7,
        dateRange: { from: "2026-07-04", to: "2026-07-10" },
        painTrend: {
          windowDays: 7,
          sampleCount: 0,
          direction: "NO_DATA",
          points: [],
        },
        averagePain: undefined,
        highPainDays: [],
        sessionResponseText: "Sin datos.",
        reboundAssociationText:
          "En esta ventana no hay sesiones claramente asociadas a un cierre con rebote.",
        sleepEnergyText: "Todavia no hay cierres suficientes para resumir sueno y energia.",
        noteHighlights: [],
        appointmentQuestions: [],
      }),
    ).toEqual([
      "Que variable conviene vigilar mejor en la siguiente semana: dolor, carga, rebote o sueno?",
    ]);
  });
});
