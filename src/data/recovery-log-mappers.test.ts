import { describe, expect, it } from "vitest";

import {
  mapSessionExerciseRow,
  toExerciseSetInsertRows,
  toSessionExerciseInsertRows,
  type SessionExerciseRow,
} from "@/data/recovery-log-mappers";
import type { SessionExercise } from "@/types/recovery";

const baseExerciseRow: SessionExerciseRow = {
  id: "exercise-1",
  session_id: "session-1",
  user_id: "user-1",
  position: 0,
  name: "Step-up",
  shortcut_id: "STEP_UP",
  duration_minutes: null,
  distance_km: null,
  sets: null,
  reps: null,
  weight: null,
  notes: null,
  created_at: "2026-07-16T18:00:00.000Z",
  updated_at: "2026-07-16T18:00:00.000Z",
};

describe("recovery log mappers", () => {
  it("maps ordered individual sets and general exercise metrics", () => {
    const exercise = mapSessionExerciseRow(
      {
        ...baseExerciseRow,
        duration_minutes: 12.5,
        distance_km: 1.75,
      },
      [
        {
          id: "set-2",
          session_exercise_id: "exercise-1",
          user_id: "user-1",
          position: 1,
          reps: 8,
          weight_kg: 15,
          notes: null,
          created_at: "2026-07-16T18:00:00.000Z",
          updated_at: "2026-07-16T18:00:00.000Z",
        },
        {
          id: "set-1",
          session_exercise_id: "exercise-1",
          user_id: "user-1",
          position: 0,
          reps: 10,
          weight_kg: 12.5,
          notes: "Controlado",
          created_at: "2026-07-16T18:00:00.000Z",
          updated_at: "2026-07-16T18:00:00.000Z",
        },
      ],
    );

    expect(exercise).toEqual({
      name: "Step-up",
      shortcutId: "STEP_UP",
      durationMinutes: 12.5,
      distanceKm: 1.75,
      sets: [
        { position: 0, reps: 10, weightKg: 12.5, notes: "Controlado" },
        { position: 1, reps: 8, weightKg: 15 },
      ],
    });
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

  it("creates exercise rows without writing legacy aggregate columns", () => {
    const exercise: SessionExercise = {
      name: "Bicicleta",
      shortcutId: "BICICLETA",
      durationMinutes: 10,
      distanceKm: 3.25,
      sets: [],
    };

    expect(toSessionExerciseInsertRows("user-1", "session-1", [exercise])).toEqual([
      {
        session_id: "session-1",
        user_id: "user-1",
        position: 0,
        name: "Bicicleta",
        shortcut_id: "BICICLETA",
        duration_minutes: 10,
        distance_km: 3.25,
        sets: null,
        reps: null,
        weight: null,
        notes: null,
      },
    ]);
  });

  it("flattens sets using their inserted exercise positions", () => {
    const exercises: SessionExercise[] = [
      {
        name: "Step-up",
        sets: [
          { position: 0, reps: 10, weightKg: 12 },
          { position: 1, reps: 8, weightKg: 14, notes: "Ultima" },
        ],
      },
    ];

    const rows = toExerciseSetInsertRows(
      "user-1",
      exercises,
      [{ id: "exercise-1", position: 0 }],
    );

    expect(rows).toEqual([
      {
        session_exercise_id: "exercise-1",
        user_id: "user-1",
        position: 0,
        reps: 10,
        weight_kg: 12,
        notes: null,
      },
      {
        session_exercise_id: "exercise-1",
        user_id: "user-1",
        position: 1,
        reps: 8,
        weight_kg: 14,
        notes: "Ultima",
      },
    ]);
  });
});
