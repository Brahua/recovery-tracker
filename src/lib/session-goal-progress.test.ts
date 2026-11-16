import { describe, expect, it } from "vitest";

import {
  countSessionsByDay,
  getDayProgress,
  getWeeklyAdherence,
  getWeekProgress,
} from "@/lib/session-goal-progress";

// 15:00 UTC = 10:00 in Lima, safely inside the Lima day.
const at = (date: string, hour = "15:00") => ({ occurredAt: `${date}T${hour}:00.000Z` });

describe("countSessionsByDay", () => {
  it("groups by the Lima day, not the UTC day", () => {
    // 2026-11-17 03:00 UTC is still the night of 2026-11-16 in Lima.
    const counts = countSessionsByDay([at("2026-11-16"), at("2026-11-17", "03:00")]);
    expect(counts.get("2026-11-16")).toBe(2);
    expect(counts.has("2026-11-17")).toBe(false);
  });
});

describe("getDayProgress", () => {
  it("marks the day done with one session when the goal is 1", () => {
    expect(getDayProgress([at("2026-11-16")], "2026-11-16", { perDay: 1, daysPerWeek: 7 })).toEqual(
      { date: "2026-11-16", count: 1, perDay: 1, met: true, status: "full" },
    );
  });

  it("is partial with fewer sessions than the goal", () => {
    const progress = getDayProgress([at("2026-11-16")], "2026-11-16", {
      perDay: 2,
      daysPerWeek: 5,
    });
    expect(progress).toMatchObject({ count: 1, met: false, status: "partial" });
  });

  it("is empty without sessions that day", () => {
    expect(
      getDayProgress([at("2026-11-15")], "2026-11-16", { perDay: 1, daysPerWeek: 7 }).status,
    ).toBe("empty");
  });
});

describe("getWeekProgress", () => {
  const goal = { perDay: 2, daysPerWeek: 3 };

  it("covers Monday to Sunday of the current week", () => {
    // 2026-11-18 is a Wednesday.
    const week = getWeekProgress([], goal, "2026-11-18T15:00:00.000Z");
    expect(week.days.map((day) => day.date)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });

  it("counts only done days and leaves out other weeks", () => {
    const sessions = [
      at("2026-11-15"), // previous Sunday
      at("2026-11-15"),
      at("2026-11-16"),
      at("2026-11-16"),
      at("2026-11-17"),
      at("2026-11-18"),
      at("2026-11-18"),
    ];
    const week = getWeekProgress(sessions, goal, "2026-11-18T15:00:00.000Z");
    expect(week.days.slice(0, 3).map((day) => day.status)).toEqual(["full", "partial", "full"]);
    expect(week.metDays).toBe(2);
    expect(week.weekMet).toBe(false);
  });

  it("is met once the done days reach the goal", () => {
    const sessions = ["2026-11-16", "2026-11-17", "2026-11-19"].flatMap((date) => [
      at(date),
      at(date),
    ]);
    const week = getWeekProgress(sessions, goal, "2026-11-19T15:00:00.000Z");
    expect(week).toMatchObject({ metDays: 3, daysPerWeek: 3, weekMet: true });
  });

  it("starts the week on Monday when today is Sunday", () => {
    const week = getWeekProgress([], goal, "2026-11-22T15:00:00.000Z");
    expect(week.days[0].date).toBe("2026-11-16");
    expect(week.days[6].date).toBe("2026-11-22");
  });
});

describe("getWeeklyAdherence", () => {
  const goal = { perDay: 1, daysPerWeek: 2 };

  it("counts full weeks inside the range and how many met the goal", () => {
    const sessions = [
      at("2026-11-02"),
      at("2026-11-04"), // week of Nov 2: met
      at("2026-11-10"), // week of Nov 9: not met
    ];
    // From a Wednesday: the week of Oct 26 is not fully inside, so it does not count.
    expect(getWeeklyAdherence(sessions, goal, "2026-10-28", "2026-11-30", "2026-11-18")).toEqual({
      weeks: 2,
      metWeeks: 1,
    });
  });

  it("leaves out the running week and has no weeks for a short range", () => {
    expect(getWeeklyAdherence([], goal, "2026-11-16", "2026-11-22", "2026-11-18")).toEqual({
      weeks: 0,
      metWeeks: 0,
    });
  });

  it("counts a week that ended yesterday", () => {
    const sessions = [at("2026-11-09"), at("2026-11-10")];
    expect(getWeeklyAdherence(sessions, goal, "2026-11-09", "2026-11-16", "2026-11-16")).toEqual({
      weeks: 1,
      metWeeks: 1,
    });
  });
});
