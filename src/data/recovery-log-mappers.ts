import type {
  ExerciseSet,
  ExerciseShortcutId,
  SessionExercise,
} from "@/types/recovery";

export type SessionExerciseRow = {
  id: string;
  session_id: string;
  user_id: string;
  position: number;
  name: string;
  shortcut_id: ExerciseShortcutId | null;
  duration_minutes: number | null;
  distance_km: number | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseSetRow = {
  id: string;
  session_exercise_id: string;
  user_id: string;
  position: number;
  reps: number | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type InsertedExerciseIdentity = Pick<SessionExerciseRow, "id" | "position">;

function mapExerciseSetRow(row: ExerciseSetRow): ExerciseSet {
  return {
    position: row.position,
    reps: row.reps ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapSessionExerciseRow(
  row: SessionExerciseRow,
  setRows: ExerciseSetRow[],
): SessionExercise {
  const hasLegacyPrescription =
    row.sets !== null || row.reps !== null || row.weight !== null;

  return {
    name: row.name,
    shortcutId: row.shortcut_id ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    distanceKm: row.distance_km ?? undefined,
    sets: setRows
      .slice()
      .sort((left, right) => left.position - right.position)
      .map(mapExerciseSetRow),
    legacyPrescription: hasLegacyPrescription
      ? {
          setCount: row.sets ?? undefined,
          reps: row.reps ?? undefined,
          weightKg: row.weight ?? undefined,
        }
      : undefined,
    notes: row.notes ?? undefined,
  };
}

export function toSessionExerciseInsertRows(
  userId: string,
  sessionId: string,
  exercises: SessionExercise[],
) {
  return exercises.map((exercise, position) => ({
    session_id: sessionId,
    user_id: userId,
    position,
    name: exercise.name,
    shortcut_id: exercise.shortcutId ?? null,
    duration_minutes: exercise.durationMinutes ?? null,
    distance_km: exercise.distanceKm ?? null,
    sets: null,
    reps: null,
    weight: null,
    notes: exercise.notes ?? null,
  }));
}

export function toExerciseSetInsertRows(
  userId: string,
  exercises: SessionExercise[],
  insertedExercises: InsertedExerciseIdentity[],
) {
  const exerciseIdByPosition = new Map(
    insertedExercises.map((exercise) => [exercise.position, exercise.id]),
  );

  return exercises.flatMap((exercise, exercisePosition) => {
    const sessionExerciseId = exerciseIdByPosition.get(exercisePosition);

    if (!sessionExerciseId) {
      throw new Error("Inserted exercise is missing for an exercise set.");
    }

    return exercise.sets.map((set) => ({
      session_exercise_id: sessionExerciseId,
      user_id: userId,
      position: set.position,
      reps: set.reps ?? null,
      weight_kg: set.weightKg ?? null,
      notes: set.notes ?? null,
    }));
  });
}
