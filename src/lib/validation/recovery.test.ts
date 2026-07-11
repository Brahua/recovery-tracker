import { describe, expect, it } from "vitest";

import {
  createNightlyCloseoutInputSchema,
  createRehabSessionInputSchema,
} from "@/lib/validation/recovery";
import { exerciseShortcuts } from "@/lib/constants/exercises";

describe("createRehabSessionInputSchema", () => {
  it("accepts a valid rehab session payload", () => {
    const result = createRehabSessionInputSchema.safeParse({
      occurredAt: "2026-07-09T18:30:00.000Z",
      sessionType: "PHYSIOTHERAPY",
      painBefore: 5,
      painDuring: 6,
      painAfter: 4,
      perceivedLoad: 3,
      exercises: [
        {
          name: "Step-up",
          shortcutId: "STEP_UP",
          sets: 3,
          reps: 10,
        },
      ],
      finalState: "BETTER",
      notes: "Menos rigidez al terminar.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects pain values outside the allowed range", () => {
    const result = createRehabSessionInputSchema.safeParse({
      occurredAt: "2026-07-09T18:30:00.000Z",
      sessionType: "HOME",
      painBefore: 11,
      painAfter: 4,
      perceivedLoad: 3,
      exercises: [{ name: "Bicicleta" }],
      finalState: "SAME",
    });

    expect(result.success).toBe(false);
  });

  it("rejects rating values outside the allowed range", () => {
    const result = createRehabSessionInputSchema.safeParse({
      occurredAt: "2026-07-09T18:30:00.000Z",
      sessionType: "HOME",
      painBefore: 4,
      painAfter: 4,
      perceivedLoad: 6,
      exercises: [{ name: "Bicicleta" }],
      finalState: "SAME",
    });

    expect(result.success).toBe(false);
  });

  it("requires at least one exercise", () => {
    const result = createRehabSessionInputSchema.safeParse({
      occurredAt: "2026-07-09T18:30:00.000Z",
      sessionType: "GYM",
      painBefore: 4,
      painAfter: 5,
      perceivedLoad: 4,
      exercises: [],
      finalState: "WORSE",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes blank notes to undefined", () => {
    const result = createRehabSessionInputSchema.parse({
      occurredAt: "2026-07-09T18:30:00.000Z",
      sessionType: "WALK",
      painBefore: 2,
      painAfter: 2,
      perceivedLoad: 1,
      exercises: [{ name: "Caminata" }],
      finalState: "SAME",
      notes: "   ",
    });

    expect(result.notes).toBeUndefined();
  });
});

describe("createNightlyCloseoutInputSchema", () => {
  it("accepts a valid nightly closeout payload", () => {
    const result = createNightlyCloseoutInputSchema.safeParse({
      date: "2026-07-09",
      endOfDayPain: 4,
      energy: 3,
      sleepHours: 7.5,
      sleepQuality: 4,
      reboundPainLevel: "MILD",
      notes: "Dolor estable por la noche.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid sleep hour values", () => {
    const result = createNightlyCloseoutInputSchema.safeParse({
      date: "2026-07-09",
      endOfDayPain: 4,
      energy: 3,
      sleepHours: 25,
      sleepQuality: 4,
      reboundPainLevel: "NONE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid rating values for energy and sleep quality", () => {
    const result = createNightlyCloseoutInputSchema.safeParse({
      date: "2026-07-09",
      endOfDayPain: 4,
      energy: 0,
      sleepHours: 7.5,
      sleepQuality: 6,
      reboundPainLevel: "NONE",
    });

    expect(result.success).toBe(false);
  });
});

describe("exercise shortcuts", () => {
  it("keep Spanish-first labels for the default shortcuts", () => {
    expect(exerciseShortcuts).toHaveLength(10);
    expect(exerciseShortcuts[0]?.label).toBe("Bicicleta 5-10 min");
    expect(exerciseShortcuts.some((shortcut) => shortcut.label === "Sentadilla espanola")).toBe(true);
    expect(
      exerciseShortcuts.some(
        (shortcut) => shortcut.label === "Caminata lateral con banda",
      ),
    ).toBe(true);
  });
});
