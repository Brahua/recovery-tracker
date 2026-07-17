import { describe, expect, it } from "vitest";

import {
  buildRecentWeek,
  calculateLoggingStreak,
  getTodayRitualState,
} from "@/lib/today-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

function sessionOn(date: string): RehabSession {
  return {
    id: `session-${date}`,
    occurredAt: `${date}T15:00:00.000Z`,
    sessionType: "HOME",
    painBefore: 2,
    painAfter: 2,
    perceivedLoad: 3,
    exercises: [{ name: "Step-up", sets: [] }],
    finalState: "SAME",
    createdAt: `${date}T15:00:00.000Z`,
    updatedAt: `${date}T15:00:00.000Z`,
  };
}

function closeoutOn(date: string): NightlyCloseout {
  return {
    id: `closeout-${date}`,
    date,
    endOfDayPain: 2,
    energy: 3,
    sleepHours: 7.5,
    sleepQuality: 4,
    reboundPainLevel: "NONE",
    createdAt: `${date}T22:00:00.000Z`,
    updatedAt: `${date}T22:00:00.000Z`,
  };
}

describe("getTodayRitualState", () => {
  it("starts with the session and zero percent when nothing is logged", () => {
    const state = getTodayRitualState(false, false);

    expect(state.progress).toBe(0);
    expect(state.primaryHref).toBe("/registrar?mode=session");
    expect(state.primaryLabel).toBe("Empezar sesion de hoy");
  });

  it("moves to closeout and fifty percent after the session", () => {
    const state = getTodayRitualState(true, false);

    expect(state.progress).toBe(50);
    expect(state.primaryHref).toBe("/registrar?mode=closeout");
    expect(state.primaryLabel).toBe("Hacer cierre nocturno");
  });

  it("marks the day complete when both rituals are logged", () => {
    const state = getTodayRitualState(true, true);

    expect(state.progress).toBe(100);
    expect(state.primaryHref).toBe("/insights");
    expect(state.primaryLabel).toBe("Ver insights");
  });
});

describe("buildRecentWeek", () => {
  it("builds the current week from Monday through Sunday and marks today", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const days = buildRecentWeek(
      [sessionOn("2026-07-14"), sessionOn("2026-07-16")],
      [closeoutOn("2026-07-15")],
      now,
    );

    expect(days).toHaveLength(7);
    expect(days.map((day) => day.key)).toEqual([
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
    ]);
    expect(days.map((day) => day.label)).toEqual(["L", "M", "X", "J", "V", "S", "D"]);
    expect(days.map((day) => day.completed)).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
    expect(days.findIndex((day) => day.isToday)).toBe(3);
  });
});

describe("calculateLoggingStreak", () => {
  it("counts consecutive logged days ending today", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const streak = calculateLoggingStreak(
      [sessionOn("2026-07-14"), sessionOn("2026-07-16")],
      [closeoutOn("2026-07-15"), closeoutOn("2026-07-12")],
      now,
    );

    expect(streak).toBe(3);
  });

  it("returns zero when today has no record", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");

    expect(calculateLoggingStreak([sessionOn("2026-07-15")], [], now)).toBe(0);
  });
});
