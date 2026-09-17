import {
  exerciseColumns,
  mapExerciseRow,
  type ExerciseRow,
} from "@/data/recovery-log-mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { exerciseIdSchema, exerciseInputSchema } from "@/lib/validation/exercises";
import type { Exercise, ExerciseInput } from "@/types/recovery";

export class ExerciseRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseRepositoryError";
  }
}

export class DuplicateExerciseNameError extends ExerciseRepositoryError {
  constructor() {
    super("Ya existe un ejercicio con ese nombre.");
    this.name = "DuplicateExerciseNameError";
  }
}

const uniqueViolationCode = "23505";

export interface ExerciseRepository {
  ensureDefaultExercises(): Promise<void>;
  listExercises(): Promise<Exercise[]>;
  createExercise(input: ExerciseInput): Promise<Exercise>;
  updateExercise(id: string, input: ExerciseInput): Promise<Exercise>;
  setExerciseArchived(id: string, archived: boolean): Promise<void>;
  mergeExercises(sourceId: string, targetId: string): Promise<number>;
}

function toExerciseWriteRow(input: ExerciseInput) {
  return {
    name: input.name,
    default_isometric: input.defaultIsometric,
    default_set_count: input.defaultSetCount ?? null,
    default_reps: input.defaultReps ?? null,
    default_hold_seconds: input.defaultHoldSeconds ?? null,
    default_weight_kg: input.defaultWeightKg ?? null,
    default_duration_minutes: input.defaultDurationMinutes ?? null,
    default_distance_km: input.defaultDistanceKm ?? null,
  };
}

function toRepositoryError(error: { code?: string; message: string }) {
  return error.code === uniqueViolationCode
    ? new DuplicateExerciseNameError()
    : new ExerciseRepositoryError(error.message);
}

async function requireAuthenticatedSupabase() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ExerciseRepositoryError("Authenticated user is required.");
  }

  return { supabase, userId: user.id };
}

export async function createExerciseRepository(): Promise<ExerciseRepository> {
  return {
    async ensureDefaultExercises() {
      const { supabase } = await requireAuthenticatedSupabase();
      const { error } = await supabase.rpc("seed_default_exercises");

      if (error) {
        throw new ExerciseRepositoryError(error.message);
      }
    },

    async listExercises() {
      const { supabase } = await requireAuthenticatedSupabase();
      const [{ data, error }, { data: usage, error: usageError }] = await Promise.all([
        supabase.from("exercises").select(exerciseColumns).order("name", { ascending: true }),
        supabase.rpc("exercise_usage"),
      ]);

      if (error || usageError) {
        throw new ExerciseRepositoryError((error ?? usageError)?.message ?? "Failed to list exercises.");
      }

      const sessionCountById = new Map(
        ((usage ?? []) as Array<{ exercise_id: string; session_count: number | string }>).map(
          (row) => [row.exercise_id, Number(row.session_count)],
        ),
      );

      return ((data ?? []) as ExerciseRow[]).map((row) =>
        mapExerciseRow(row, sessionCountById.get(row.id) ?? 0),
      );
    },

    async createExercise(input) {
      const parsed = exerciseInputSchema.parse(input);
      const { supabase, userId } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("exercises")
        .insert({ user_id: userId, ...toExerciseWriteRow(parsed) })
        .select(exerciseColumns)
        .single();

      if (error || !data) {
        throw error ? toRepositoryError(error) : new ExerciseRepositoryError("Failed to create exercise.");
      }

      return mapExerciseRow(data as ExerciseRow);
    },

    async updateExercise(id, input) {
      const exerciseId = exerciseIdSchema.parse(id);
      const parsed = exerciseInputSchema.parse(input);
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("exercises")
        .update(toExerciseWriteRow(parsed))
        .eq("id", exerciseId)
        .select(exerciseColumns)
        .single();

      if (error || !data) {
        throw error ? toRepositoryError(error) : new ExerciseRepositoryError("Exercise not found.");
      }

      return mapExerciseRow(data as ExerciseRow);
    },

    async setExerciseArchived(id, archived) {
      const exerciseId = exerciseIdSchema.parse(id);
      const { supabase } = await requireAuthenticatedSupabase();
      const { error } = await supabase
        .from("exercises")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", exerciseId);

      if (error) {
        throw new ExerciseRepositoryError(error.message);
      }
    },

    async mergeExercises(sourceId, targetId) {
      const source = exerciseIdSchema.parse(sourceId);
      const target = exerciseIdSchema.parse(targetId);
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase.rpc("merge_exercises", {
        source_id: source,
        target_id: target,
      });

      if (error) {
        throw new ExerciseRepositoryError(error.message);
      }

      return Number(data ?? 0);
    },
  };
}
