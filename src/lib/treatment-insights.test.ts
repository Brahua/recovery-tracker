import { describe, expect, it } from "vitest";

import { calculateTreatmentFrequency, calculateTreatmentResponse } from "@/lib/treatment-insights";
import type { NightlyCloseout, PainScore, RehabSession, SessionTreatment } from "@/types/recovery";

const laser: SessionTreatment = {
  category: "PHYSICAL_AGENT",
  modality: "LASER",
  bodyZone: "Tendón rotuliano",
};
const tecar: SessionTreatment = { category: "PHYSICAL_AGENT", modality: "TECAR" };

function session(
  day: number,
  painBefore: PainScore,
  painAfter: PainScore,
  treatments: SessionTreatment[],
  sessionType: RehabSession["sessionType"] = "PHYSIOTHERAPY",
): RehabSession {
  const occurredAt = `2026-09-${String(day).padStart(2, "0")}T15:00:00.000Z`;
  return {
    id: `s-${day}`,
    occurredAt,
    sessionType,
    painBefore,
    painAfter,
    perceivedLoad: 3,
    exercises: [],
    finalState: "SAME",
    treatments,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

function closeout(day: number, rebound: NightlyCloseout["reboundPainLevel"]): NightlyCloseout {
  const date = `2026-09-${String(day).padStart(2, "0")}`;
  return {
    id: `c-${day}`,
    date,
    endOfDayPain: 3,
    energy: 3,
    sleepHours: 7,
    sleepQuality: 3,
    reboundPainLevel: rebound,
    createdAt: `${date}T23:00:00.000Z`,
    updatedAt: `${date}T23:00:00.000Z`,
  };
}

describe("calculateTreatmentFrequency", () => {
  it("counts each treatment with its distinct zones, most frequent first", () => {
    const sessions = [
      session(1, 4, 3, [laser, tecar]),
      session(2, 4, 3, [{ ...laser, bodyZone: "tendón rotuliano" }]),
      session(3, 4, 3, [{ ...laser, bodyZone: "Rodilla medial" }]),
      session(4, 4, 3, [{ category: "INVASIVE", modality: "OTHER", customName: "Indiba" }]),
    ];

    expect(calculateTreatmentFrequency(sessions)).toEqual([
      { key: "LASER", label: "Láser", count: 3, zones: ["Tendón rotuliano", "Rodilla medial"] },
      { key: "OTHER:indiba", label: "Indiba", count: 1, zones: [] },
      { key: "TECAR", label: "Tecarterapia", count: 1, zones: [] },
    ]);
  });

  it("ignores non-physio sessions", () => {
    expect(calculateTreatmentFrequency([session(1, 4, 3, [laser], "HOME")])).toEqual([]);
  });
});

describe("calculateTreatmentResponse", () => {
  it("compares pain change and rebound against physio sessions without the treatment", () => {
    const sessions = [
      session(1, 5, 3, [laser]),
      session(2, 5, 4, [laser]),
      session(3, 4, 3, [laser]),
      session(4, 4, 4, [tecar]),
      session(5, 3, 4, []),
      session(6, 3, 2, [], "HOME"),
    ];
    const closeouts = [
      closeout(1, "NONE"),
      closeout(2, "MILD"),
      closeout(4, "STRONG"),
      closeout(5, "NONE"),
    ];

    const [laserResponse, tecarResponse] = calculateTreatmentResponse(sessions, closeouts);

    expect(laserResponse).toEqual({
      key: "LASER",
      label: "Láser",
      sessionCount: 3,
      hasEnoughData: true,
      painDeltaWith: -1.3,
      painDeltaWithout: 0.5,
      reboundRateWith: 50,
      reboundRateWithout: 50,
    });
    expect(tecarResponse).toMatchObject({ key: "TECAR", sessionCount: 1, hasEnoughData: false });
    expect(tecarResponse.painDeltaWith).toBeUndefined();
  });

  it("leaves rebound empty when no closeout matches", () => {
    const sessions = [
      session(1, 5, 3, [laser]),
      session(2, 5, 4, [laser]),
      session(3, 4, 3, [laser]),
    ];

    expect(calculateTreatmentResponse(sessions, [])[0]).toMatchObject({
      reboundRateWith: undefined,
      painDeltaWithout: undefined,
    });
  });
});
