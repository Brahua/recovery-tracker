import { describe, expect, it } from "vitest";

import { summarizeExercise, summarizeExerciseDefaults } from "@/lib/exercise-summary";

describe("summarizeExercise", () => {
  it("summarizes repetition sets with weight", () => {
    expect(
      summarizeExercise({
        isIsometric: false,
        sets: [
          { reps: 12, weightKg: 5 },
          { reps: 12, weightKg: 5 },
          { reps: 12, weightKg: 5 },
        ],
      }),
    ).toBe("3 × 12 · 5 kg");
  });

  it("shows ranges when sets differ and hides zero weight", () => {
    expect(
      summarizeExercise({
        isIsometric: false,
        sets: [{ reps: 12, weightKg: 0 }, { reps: 8 }],
      }),
    ).toBe("2 × 8–12");
  });

  it("summarizes isometric sets in seconds", () => {
    expect(
      summarizeExercise({
        isIsometric: true,
        sets: [{ holdSeconds: 45 }, { holdSeconds: 45, reps: 3 }, { holdSeconds: 45 }],
      }),
    ).toBe("3 × 45 s");
  });

  it("falls back to the set count and appends duration and distance", () => {
    expect(
      summarizeExercise({
        isIsometric: false,
        sets: [{ weightKg: 10 }],
        durationMinutes: 12.5,
        distanceKm: 2,
      }),
    ).toBe("1 serie · 10 kg · 12,5 min · 2 km");
    expect(summarizeExercise({ isIsometric: false, sets: [], durationMinutes: 10 })).toBe("10 min");
    expect(summarizeExercise({ isIsometric: false, sets: [] })).toBe("");
  });
});

describe("summarizeExerciseDefaults", () => {
  it("expands the default set count", () => {
    expect(
      summarizeExerciseDefaults({
        defaultIsometric: true,
        defaultSetCount: 3,
        defaultHoldSeconds: 45,
      }),
    ).toBe("3 × 45 s");
    expect(summarizeExerciseDefaults({ defaultIsometric: false })).toBe("");
  });
});
