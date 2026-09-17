import type {
  Exercise,
  ExerciseSet,
  SessionExercise,
} from "@/types/recovery";

export const sessionExerciseColumns =
  "id, session_id, user_id, position, name, exercise_id, is_isometric, duration_minutes, distance_km, sets, reps, weight, notes, created_at, updated_at";

export const exerciseSetColumns =
  "id, session_exercise_id, user_id, position, reps, weight_kg, hold_seconds, notes, created_at, updated_at";

export const exerciseColumns =
  "id, user_id, name, default_isometric, default_set_count, default_reps, default_hold_seconds, default_weight_kg, default_duration_minutes, default_distance_km, archived_at, created_at, updated_at";

export type SessionExerciseRow = {
  id: string;
  session_id: string;
  user_id: string;
  position: number;
  name: string;
  exercise_id: string | null;
  is_isometric: boolean;
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
  hold_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseRow = {
  id: string;
  user_id: string;
  name: string;
  default_isometric: boolean;
  default_set_count: number | null;
  default_reps: number | null;
  default_hold_seconds: number | null;
  default_weight_kg: number | string | null;
  default_duration_minutes: number | string | null;
  default_distance_km: number | string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function optionalNumber(value: number | string | null) {
  return value === null ? undefined : Number(value);
}

function mapExerciseSetRow(row: ExerciseSetRow): ExerciseSet {
  return {
    position: row.position,
    reps: row.reps ?? undefined,
    weightKg: optionalNumber(row.weight_kg),
    holdSeconds: row.hold_seconds ?? undefined,
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
    exerciseId: row.exercise_id ?? undefined,
    isIsometric: row.is_isometric,
    durationMinutes: optionalNumber(row.duration_minutes),
    distanceKm: optionalNumber(row.distance_km),
    sets: setRows
      .slice()
      .sort((left, right) => left.position - right.position)
      .map(mapExerciseSetRow),
    legacyPrescription: hasLegacyPrescription
      ? {
          setCount: row.sets ?? undefined,
          reps: row.reps ?? undefined,
          weightKg: optionalNumber(row.weight),
        }
      : undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapExerciseRow(row: ExerciseRow, sessionCount = 0): Exercise {
  return {
    id: row.id,
    name: row.name,
    defaultIsometric: row.default_isometric,
    defaultSetCount: row.default_set_count ?? undefined,
    defaultReps: row.default_reps ?? undefined,
    defaultHoldSeconds: row.default_hold_seconds ?? undefined,
    defaultWeightKg: optionalNumber(row.default_weight_kg),
    defaultDurationMinutes: optionalNumber(row.default_duration_minutes),
    defaultDistanceKm: optionalNumber(row.default_distance_km),
    archivedAt: row.archived_at ?? undefined,
    sessionCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
