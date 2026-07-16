import { describe, expect, it } from "vitest";

import {
  buildFourWeekSessionCounts,
  buildReboundDistribution,
} from "@/lib/insights-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

function sessionOn(id: string, date: string): RehabSession {
  return {
    id,
    occurredAt: `${date}T18:00:00.000Z`,
    sessionType: "HOME",
    painBefore: 3,
    painAfter: 2,
    perceivedLoad: 3,
    exercises: [],
    finalState: "BETTER",
    createdAt: `${date}T18:10:00.000Z`,
    updatedAt: `${date}T18:10:00.000Z`,
  };
}

function closeoutWith(
  id: string,
  reboundPainLevel: NightlyCloseout["reboundPainLevel"],
): NightlyCloseout {
  return {
    id,
    date: `2026-07-${id.padStart(2, "0")}`,
    endOfDayPain: 3,
    energy: 3,
    sleepHours: 7,
    sleepQuality: 3,
    reboundPainLevel,
    createdAt: "2026-07-10T22:00:00.000Z",
    updatedAt: "2026-07-10T22:00:00.000Z",
  };
}

describe("buildFourWeekSessionCounts", () => {
  it("groups the latest 28 days into chronological seven-day buckets", () => {
    const result = buildFourWeekSessionCounts(
      [
        sessionOn("session-1", "2026-07-01"),
        sessionOn("session-2", "2026-07-08"),
        sessionOn("session-3", "2026-07-15"),
        sessionOn("session-4", "2026-07-16"),
        sessionOn("outside", "2026-06-18"),
      ],
      "2026-07-16T12:00:00.000Z",
    );

    expect(result).toEqual([
      { label: "S1", count: 0 },
      { label: "S2", count: 1 },
      { label: "S3", count: 1 },
      { label: "S4", count: 2 },
    ]);
  });
});

describe("buildReboundDistribution", () => {
  it("combines moderate and strong rebound into the affirmative bucket", () => {
    const result = buildReboundDistribution([
      closeoutWith("1", "NONE"),
      closeoutWith("2", "NONE"),
      closeoutWith("3", "MILD"),
      closeoutWith("4", "MODERATE"),
      closeoutWith("5", "STRONG"),
    ]);

    expect(result).toEqual([
      { label: "Sin rebote", count: 2, percentage: 40, tone: "none" },
      { label: "Un poco", count: 1, percentage: 20, tone: "mild" },
      { label: "Si", count: 2, percentage: 40, tone: "strong" },
    ]);
  });

  it("returns zeroed buckets when there are no closeouts", () => {
    expect(buildReboundDistribution([]).map((item) => item.percentage)).toEqual([
      0, 0, 0,
    ]);
  });
});
