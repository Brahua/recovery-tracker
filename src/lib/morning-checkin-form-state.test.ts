import { describe, expect, it } from "vitest";

import { formatSleepHours, getMorningCheckinFormProgress } from "@/lib/morning-checkin-form-state";

const empty = {
  sleepQuality: null,
  wakingPain: null,
  stiffnessLevel: null,
  reboundPainLevel: null,
};

describe("getMorningCheckinFormProgress", () => {
  it("asks three things when the day before had no sessions", () => {
    expect(getMorningCheckinFormProgress({ ...empty, asksRebound: false })).toEqual({
      completedSteps: 0,
      totalSteps: 3,
      missingSteps: 3,
      isComplete: false,
    });
    expect(
      getMorningCheckinFormProgress({
        sleepQuality: 4,
        wakingPain: 2,
        stiffnessLevel: "MILD",
        reboundPainLevel: null,
        asksRebound: false,
      }).isComplete,
    ).toBe(true);
  });

  it("also needs the rebound after a day with sessions", () => {
    const answered = {
      sleepQuality: 4 as const,
      wakingPain: 2 as const,
      stiffnessLevel: "MILD" as const,
      asksRebound: true,
    };
    expect(getMorningCheckinFormProgress({ ...answered, reboundPainLevel: null })).toMatchObject({
      totalSteps: 4,
      missingSteps: 1,
      isComplete: false,
    });
    expect(
      getMorningCheckinFormProgress({ ...answered, reboundPainLevel: "NONE" }).isComplete,
    ).toBe(true);
  });
});

describe("formatSleepHours", () => {
  it("uses a comma for half hours", () => {
    expect(formatSleepHours(7)).toBe("7");
    expect(formatSleepHours(7.5)).toBe("7,5");
  });
});
