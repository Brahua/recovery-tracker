import { describe, expect, it } from "vitest";

import {
  mapExerciseRow,
  mapSessionExerciseRow,
  type ExerciseSetRow,
  type SessionExerciseRow,
} from "@/data/recovery-log-mappers";

const timestamp = "2026-07-16T18:00:00.000Z";

const baseExerciseRow: SessionExerciseRow = {
  id: "exercise-1",
  session_id: "session-1",
  user_id: "user-1",
  position: 0,
  name: "Step-up",
  exercise_id: "catalog-1",
  is_isometric: false,
  duration_minutes: null,
  distance_km: null,
  sets: null,
  reps: null,
  weight: null,
  notes: null,
  created_at: timestamp,
  updated_at: timestamp,
};

function setRow(overrides: Partial<ExerciseSetRow>): ExerciseSetRow {
  return {
    id: "set-1",
    session_exercise_id: "exercise-1",
    user_id: "user-1",
    position: 0,
    reps: null,
    weight_kg: null,
    hold_seconds: null,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
}

describe("recovery log mappers", () => {
  it("maps ordered individual sets, catalog link and general exercise metrics", () => {
    const exercise = mapSessionExerciseRow(
      {
        ...baseExerciseRow,
        duration_minutes: 12.5,
        distance_km: 1.75,
      },
      [
        setRow({ id: "set-2", position: 1, reps: 8, weight_kg: 15 }),
        setRow({ id: "set-1", position: 0, reps: 10, weight_kg: 12.5, notes: "Controlado" }),
      ],
    );

    expect(exercise).toEqual({
      name: "Step-up",
      exerciseId: "catalog-1",
      isIsometric: false,
      durationMinutes: 12.5,
      distanceKm: 1.75,
      sets: [
        { position: 0, reps: 10, weightKg: 12.5, notes: "Controlado" },
        { position: 1, reps: 8, weightKg: 15 },
      ],
    });
  });

  it("maps isometric hold seconds", () => {
    const exercise = mapSessionExerciseRow(
      { ...baseExerciseRow, name: "Wall sit", is_isometric: true },
      [setRow({ hold_seconds: 45 })],
    );

    expect(exercise.isIsometric).toBe(true);
    expect(exercise.sets).toEqual([{ position: 0, holdSeconds: 45 }]);
  });

  it("keeps legacy aggregate values separate from individual sets", () => {
    const exercise = mapSessionExerciseRow(
      {
        ...baseExerciseRow,
        sets: 3,
        reps: 10,
        weight: 8,
      },
      [],
    );

    expect(exercise.sets).toEqual([]);
    expect(exercise.legacyPrescription).toEqual({
      setCount: 3,
      reps: 10,
      weightKg: 8,
    });
  });

  it("maps catalog rows converting numeric strings", () => {
    expect(
      mapExerciseRow(
        {
          id: "catalog-1",
          user_id: "user-1",
          name: "Bicicleta 5-10 min",
          default_isometric: false,
          default_set_count: null,
          default_reps: null,
          default_hold_seconds: null,
          default_weight_kg: "2.50",
          default_duration_minutes: "10.00",
          default_distance_km: null,
          archived_at: null,
          created_at: timestamp,
          updated_at: timestamp,
        },
        4,
      ),
    ).toEqual({
      id: "catalog-1",
      name: "Bicicleta 5-10 min",
      defaultIsometric: false,
      defaultWeightKg: 2.5,
      defaultDurationMinutes: 10,
      sessionCount: 4,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
});
