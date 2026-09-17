import { describe, expect, it } from "vitest";

import {
  createNightlyCloseoutInputSchema,
  createRehabSessionInputSchema,
  sessionExerciseSchema,
} from "@/lib/validation/recovery";

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
          sets: [
            { position: 0, reps: 12, weightKg: 10 },
            { position: 1, reps: 10, weightKg: 12.5 },
            { position: 2, reps: 8, weightKg: 14, notes: "Sin dolor" },
          ],
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
      exercises: [{ name: "Bicicleta", durationMinutes: 10, sets: [] }],
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
      exercises: [{ name: "Bicicleta", durationMinutes: 10, sets: [] }],
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
      exercises: [{ name: "Caminata", distanceKm: 1.5, sets: [] }],
      finalState: "SAME",
      notes: "   ",
    });

    expect(result.notes).toBeUndefined();
  });
});

describe("sessionExerciseSchema", () => {
  it("accepts an exercise measured by duration and distance without sets", () => {
    const result = sessionExerciseSchema.safeParse({
      name: "Bicicleta",
      durationMinutes: 12.5,
      distanceKm: 4.2,
      sets: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an exercise without a valid set, duration, or distance", () => {
    const result = sessionExerciseSchema.safeParse({
      name: "Step-up",
      sets: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty set", () => {
    const result = sessionExerciseSchema.safeParse({
      name: "TKE",
      sets: [{ position: 0 }],
    });

    expect(result.success).toBe(false);
  });

  it("normalizes blank set notes and keeps independent values", () => {
    const result = sessionExerciseSchema.parse({
      name: "Peso muerto rumano",
      sets: [
        { position: 0, reps: 10, weightKg: 20, notes: "   " },
        { position: 1, reps: 8, weightKg: 25 },
      ],
    });

    expect(result.sets).toEqual([
      { position: 0, reps: 10, weightKg: 20, notes: undefined },
      { position: 1, reps: 8, weightKg: 25 },
    ]);
  });

  it("rejects duplicate set positions", () => {
    const result = sessionExerciseSchema.safeParse({
      name: "Hip thrust",
      sets: [
        { position: 0, reps: 10 },
        { position: 0, reps: 8 },
      ],
    });

    expect(result.success).toBe(false);
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

describe("isometric exercises", () => {
  it("accepts sets measured only by hold seconds when the exercise is isometric", () => {
    const result = sessionExerciseSchema.parse({
      name: "Wall sit",
      isIsometric: true,
      sets: [
        { position: 0, holdSeconds: 45 },
        { position: 1, holdSeconds: 40, weightKg: 5 },
      ],
    });

    expect(result.sets[0]).toEqual({ position: 0, holdSeconds: 45 });
  });

  it("rejects hold-only sets and drops hold seconds on non-isometric exercises", () => {
    expect(
      sessionExerciseSchema.safeParse({
        name: "Wall sit",
        sets: [{ position: 0, holdSeconds: 45 }],
      }).success,
    ).toBe(false);

    const result = sessionExerciseSchema.parse({
      name: "Step-up",
      sets: [{ position: 0, reps: 12, holdSeconds: 30 }],
    });

    expect(result.isIsometric).toBe(false);
    expect(result.sets[0]?.holdSeconds).toBeUndefined();
  });

  it("only accepts a UUID as catalog reference", () => {
    expect(
      sessionExerciseSchema.safeParse({
        name: "Wall sit",
        exerciseId: "not-a-uuid",
        sets: [{ position: 0, reps: 1 }],
      }).success,
    ).toBe(false);
  });
});
