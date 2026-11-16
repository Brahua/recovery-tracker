import { describe, expect, it } from "vitest";

import {
  buildRecentWeek,
  calculateLoggingStreak,
  getTodayRitualState,
} from "@/lib/today-view-model";
import { getWeekProgress, type DayProgress, type WeekProgress } from "@/lib/session-goal-progress";
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
    treatments: [],
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

const day = (count: number, perDay = 1): DayProgress => ({
  date: "2026-07-16",
  count,
  perDay,
  met: count >= perDay,
  status: count >= perDay ? "full" : count > 0 ? "partial" : "empty",
});

const week = (metDays: number, daysPerWeek = 7): WeekProgress => ({
  days: [],
  metDays,
  daysPerWeek,
  weekMet: metDays >= daysPerWeek,
});

describe("getTodayRitualState with a condition", () => {
  it("words the body with the area of the injury", () => {
    expect(
      getTodayRitualState({
        day: day(0),
        week: week(0),
        hasCheckinToday: false,
        areaPhrase: "tu hombro izquierdo",
      }).body,
    ).toBe("Un paso más para tu hombro izquierdo.");
    expect(getTodayRitualState({ day: day(0), week: week(0), hasCheckinToday: false }).body).toBe(
      "Un paso más cerca de tu recuperación.",
    );
  });
});

describe("getTodayRitualState", () => {
  it("starts with the session and zero percent when nothing is logged", () => {
    const state = getTodayRitualState({ day: day(0), week: week(0), hasCheckinToday: false });

    expect(state.progress).toBe(0);
    expect(state.primaryHref).toBe("/registrar?mode=session");
    expect(state.primaryLabel).toBe("Empezar sesión de hoy");
    expect(state.secondaryLabel).toBe("¿Cómo amaneciste?");
    expect(state.secondaryHref).toBe("/registrar?mode=morning");
  });

  it("completes the day with one session when the goal is 1, without a closeout", () => {
    const state = getTodayRitualState({ day: day(1), week: week(1), hasCheckinToday: false });

    expect(state.progress).toBe(100);
    expect(state.eyebrow).toBe("Día completo");
    expect(state.title).toBe("Sesión hecha. Día completo.");
    expect(state.body).toBe("Llevas 1 de 7 días esta semana.");
    expect(state.primaryHref).toBe("/insights");
  });

  it("shows k of N and the share when the goal is 2", () => {
    const state = getTodayRitualState({ day: day(1, 2), week: week(0, 5), hasCheckinToday: true });

    expect(state.progress).toBe(50);
    expect(state.title).toBe("Llevas 1 de 2 sesiones.");
    expect(state.body).toBe("Te falta 1 sesión para completar el día.");
    expect(state.primaryLabel).toBe("Registrar otra sesión");
    expect(state.secondaryHref).toBe("/insights");
  });

  it("completes the day at the second session of a 2-session goal", () => {
    const state = getTodayRitualState({ day: day(2, 2), week: week(5, 5), hasCheckinToday: true });

    expect(state.progress).toBe(100);
    expect(state.title).toBe("2 sesiones. Día completo.");
    expect(state.body).toBe("Semana cumplida. Ya hiciste lo importante.");
    expect(state.secondaryLabel).toBe("Registrar otra sesión");
  });

  it("offers rest once the week is met and today has no sessions", () => {
    const state = getTodayRitualState({ day: day(0), week: week(3, 3), hasCheckinToday: true });

    expect(state.eyebrow).toBe("Semana cumplida");
    expect(state.title).toBe("Hoy puedes descansar o sumar una sesión.");
    expect(state.progress).toBe(0);
  });
});

describe("buildRecentWeek", () => {
  it("labels Monday through Sunday, keeps each day's status and marks today", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const progress = getWeekProgress(
      [sessionOn("2026-07-14"), sessionOn("2026-07-16"), sessionOn("2026-07-16")],
      { perDay: 2, daysPerWeek: 5 },
      now,
    );
    const days = buildRecentWeek(progress, now);

    expect(days.map((item) => item.key)).toEqual([
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
    ]);
    expect(days.map((item) => item.label)).toEqual(["L", "M", "X", "J", "V", "S", "D"]);
    expect(days.map((item) => item.status)).toEqual([
      "empty",
      "partial",
      "empty",
      "full",
      "empty",
      "empty",
      "empty",
    ]);
    expect(days.findIndex((item) => item.isToday)).toBe(3);
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
