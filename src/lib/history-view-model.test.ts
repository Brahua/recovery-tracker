import { describe, expect, it } from "vitest";

import {
  buildHistoryDays,
  getHistoryDaySummary,
  getHistoryWindow,
} from "@/lib/history-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

function session(
  id: string,
  occurredAt: string,
  overrides: Partial<RehabSession> = {},
): RehabSession {
  return {
    id,
    occurredAt,
    sessionType: "HOME",
    painBefore: 2,
    painAfter: 3,
    perceivedLoad: 3,
    exercises: [],
    finalState: "SAME",
    createdAt: occurredAt,
    updatedAt: occurredAt,
    ...overrides,
  };
}

function closeout(date: string): NightlyCloseout {
  return {
    id: `closeout-${date}`,
    date,
    endOfDayPain: 3,
    energy: 4,
    sleepHours: 7.5,
    sleepQuality: 4,
    reboundPainLevel: "MILD",
    createdAt: `${date}T23:30:00.000Z`,
    updatedAt: `${date}T23:30:00.000Z`,
  };
}

describe("getHistoryWindow", () => {
  it("creates an inclusive 30-day window ending today", () => {
    expect(getHistoryWindow(undefined, new Date("2026-07-16T18:00:00-05:00"))).toEqual({
      from: "2026-06-17",
      to: "2026-07-16",
      previousTo: "2026-06-16",
    });
  });

  it("uses a valid before date and ignores malformed or future input", () => {
    const now = new Date("2026-07-16T18:00:00-05:00");

    expect(getHistoryWindow("2026-05-31", now).to).toBe("2026-05-31");
    expect(getHistoryWindow("not-a-date", now).to).toBe("2026-07-16");
    expect(getHistoryWindow("2027-01-01", now).to).toBe("2026-07-16");
  });
});

describe("buildHistoryDays", () => {
  it("groups sessions and the closeout by Lima day in descending day order", () => {
    const sessions = [
      session("late", "2026-07-17T00:47:00.000Z"),
      session("morning", "2026-07-16T14:00:00.000Z"),
      session("previous", "2026-07-15T16:00:00.000Z"),
    ];

    const days = buildHistoryDays(sessions, [closeout("2026-07-16")]);

    expect(days.map((day) => day.date)).toEqual(["2026-07-16", "2026-07-15"]);
    expect(days[0]?.sessions.map((item) => item.id)).toEqual(["morning", "late"]);
    expect(days[0]?.closeout?.date).toBe("2026-07-16");
  });

  it("includes days that only contain a nightly closeout", () => {
    expect(buildHistoryDays([], [closeout("2026-07-10")])).toHaveLength(1);
  });
});

describe("getHistoryDaySummary", () => {
  it("summarizes sessions, exercises, and closeout presence", () => {
    const day = buildHistoryDays([
      session("one", "2026-07-16T14:00:00.000Z", {
        exercises: [
          { name: "Step-up", sets: [{ position: 0, reps: 10 }] },
          { name: "TKE", sets: [{ position: 0, reps: 12 }] },
        ],
      }),
      session("two", "2026-07-16T20:00:00.000Z", {
        exercises: [{ name: "Bicicleta", durationMinutes: 10, sets: [] }],
      }),
    ], [closeout("2026-07-16")])[0];

    expect(day && getHistoryDaySummary(day)).toBe(
      "2 sesiones · 3 ejercicios · cierre listo",
    );
  });
});
