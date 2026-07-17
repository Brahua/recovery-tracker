import { describe, expect, it } from "vitest";

import {
  buildAppointmentQuestions,
  buildReboundAssociationReport,
  buildSessionResponseReport,
  buildSleepEnergyReport,
  createMedicalReportSummary,
} from "@/lib/recovery-insights";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const sessions: RehabSession[] = [
  {
    id: "session-1",
    occurredAt: "2026-07-08T18:00:00.000Z",
    sessionType: "HOME",
    painBefore: 5,
    painAfter: 4,
    perceivedLoad: 3,
    exercises: [{ name: "Step-up", sets: [] }, { name: "TKE", sets: [] }],
    finalState: "BETTER",
    notes: "La rodilla respondio mejor de lo esperado.",
    createdAt: "2026-07-08T18:10:00.000Z",
    updatedAt: "2026-07-08T18:10:00.000Z",
  },
  {
    id: "session-2",
    occurredAt: "2026-07-10T18:00:00.000Z",
    sessionType: "PHYSIOTHERAPY",
    painBefore: 4,
    painAfter: 5,
    perceivedLoad: 4,
    exercises: [{ name: "Step-up", sets: [] }],
    finalState: "WORSE",
    createdAt: "2026-07-10T18:10:00.000Z",
    updatedAt: "2026-07-10T18:10:00.000Z",
  },
];

const closeouts: NightlyCloseout[] = [
  {
    id: "closeout-1",
    date: "2026-07-08",
    endOfDayPain: 6,
    energy: 2,
    sleepHours: 5,
    sleepQuality: 2,
    reboundPainLevel: "MODERATE",
    notes: "Dolor alto al final del dia.",
    createdAt: "2026-07-08T23:00:00.000Z",
    updatedAt: "2026-07-08T23:00:00.000Z",
  },
  {
    id: "closeout-2",
    date: "2026-07-10",
    endOfDayPain: 4,
    energy: 4,
    sleepHours: 7.5,
    sleepQuality: 4,
    reboundPainLevel: "NONE",
    createdAt: "2026-07-10T23:00:00.000Z",
    updatedAt: "2026-07-10T23:00:00.000Z",
  },
];

describe("medical report insights", () => {
  it("builds a session response summary without advice", () => {
    const text = buildSessionResponseReport(
      sessions,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(text).toContain("2 sesiones");
    expect(text).toContain("1 terminaron mejor");
  });

  it("detects rebound-related exercise repetition", () => {
    const text = buildReboundAssociationReport(
      sessions,
      closeouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(text).toContain("coincidieron con rebote");
    expect(text).toContain("Step-up");
  });

  it("summarizes sleep and energy conservatively", () => {
    const text = buildSleepEnergyReport(
      closeouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(text).toContain("sueno promedio");
    expect(text).toContain("energia promedio");
  });

  it("creates a medical report summary with questions and notes", () => {
    const summary = createMedicalReportSummary(
      sessions,
      closeouts,
      7,
      "2026-07-10T12:00:00.000Z",
    );

    expect(summary.highPainDays).toEqual([{ date: "2026-07-08", pain: 6 }]);
    expect(summary.noteHighlights[0]).toContain("Dolor alto");
    expect(summary.appointmentQuestions.length).toBeGreaterThan(0);
  });

  it("adds targeted appointment questions when the report shows rising pain and rebound patterns", () => {
    const questions = buildAppointmentQuestions({
      windowDays: 7,
      dateRange: { from: "2026-07-04", to: "2026-07-10" },
      painTrend: {
        windowDays: 7,
        sampleCount: 3,
        averagePain: 6,
        startAverage: 4.5,
        endAverage: 6.5,
        delta: 2,
        direction: "UP",
        points: [
          { date: "2026-07-08", pain: 5 },
          { date: "2026-07-09", pain: 6 },
          { date: "2026-07-10", pain: 7 },
        ],
      },
      averagePain: 6,
      highPainDays: [{ date: "2026-07-10", pain: 7 }],
      sessionResponseText: "En 7 dias hubo 2 sesiones.",
      reboundAssociationText:
        "Las sesiones que coincidieron con rebote fueron 1. Los ejercicios que mas se repiten en ese grupo son: Step-up.",
      sleepEnergyText: "En 7 dias, el sueno promedio fue 6 h y la energia promedio 3/5.",
      noteHighlights: [],
      appointmentQuestions: [],
    });

    expect(questions).toContain(
      "Que cambios recientes conviene revisar si el dolor de cierre va subiendo?",
    );
    expect(questions).toContain(
      "Estos ejercicios o combinaciones merecen algun ajuste cuando aparece rebote?",
    );
  });
});
