import { describe, expect, it } from "vitest";

import { getCloseoutFormProgress } from "@/lib/closeout-form-state";

describe("getCloseoutFormProgress", () => {
  it("starts empty even though sleep hours have a default", () => {
    expect(
      getCloseoutFormProgress({
        endOfDayPain: null,
        energy: null,
        reboundPainLevel: null,
        sleepQuality: null,
      }),
    ).toEqual({ completedSteps: 0, isComplete: false, missingSteps: 4, totalSteps: 4 });
  });

  it("counts zero as a recorded pain value", () => {
    expect(
      getCloseoutFormProgress({
        endOfDayPain: 0,
        energy: 4,
        reboundPainLevel: "NONE",
        sleepQuality: 5,
      }).isComplete,
    ).toBe(true);
  });

  it("requires pain, energy, rebound and sleep quality", () => {
    expect(
      getCloseoutFormProgress({
        endOfDayPain: 3,
        energy: 2,
        reboundPainLevel: null,
        sleepQuality: 3,
      }),
    ).toEqual({ completedSteps: 3, isComplete: false, missingSteps: 1, totalSteps: 4 });
  });
});
