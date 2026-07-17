import { describe, expect, it } from "vitest";

import { getSessionFormProgress } from "@/lib/session-form-state";

describe("getSessionFormProgress", () => {
  it("starts at two of five with pain before and selected exercises", () => {
    expect(
      getSessionFormProgress({
        painBefore: 3,
        painDuring: null,
        painAfter: null,
        finalState: null,
        exerciseCount: 2,
        selectedExerciseCount: 2,
      }),
    ).toEqual({ completedSteps: 2, isComplete: false, missingSteps: 3, totalSteps: 5 });
  });

  it("counts zero as a recorded pain value", () => {
    expect(
      getSessionFormProgress({
        painBefore: 0,
        painDuring: 0,
        painAfter: 0,
        finalState: "SAME",
        exerciseCount: 1,
        selectedExerciseCount: 1,
      }).isComplete,
    ).toBe(true);
  });

  it("requires at least one exercise", () => {
    expect(
      getSessionFormProgress({
        painBefore: 3,
        painDuring: 4,
        painAfter: 2,
        finalState: "BETTER",
        exerciseCount: 0,
        selectedExerciseCount: 0,
      }),
    ).toEqual({ completedSteps: 4, isComplete: false, missingSteps: 1, totalSteps: 5 });
  });

  it("requires every selected exercise to be complete", () => {
    expect(
      getSessionFormProgress({
        painBefore: 3,
        painDuring: 4,
        painAfter: 2,
        finalState: "BETTER",
        exerciseCount: 1,
        selectedExerciseCount: 2,
      }),
    ).toEqual({ completedSteps: 4, isComplete: false, missingSteps: 1, totalSteps: 5 });
  });
});
