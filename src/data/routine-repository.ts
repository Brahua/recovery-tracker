import {
  mapRoutineRows,
  routineColumns,
  routineExerciseColumns,
  routineExerciseSetColumns,
  type RoutineExerciseRow,
  type RoutineExerciseSetRow,
  type RoutineRow,
} from "@/data/recovery-log-mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routineIdSchema, routineInputSchema, routineNameSchema } from "@/lib/validation/routines";
import type { Routine } from "@/types/recovery";

export class RoutineRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoutineRepositoryError";
  }
}

export class DuplicateRoutineNameError extends RoutineRepositoryError {
  constructor() {
    super("Ya existe una rutina con ese nombre.");
    this.name = "DuplicateRoutineNameError";
  }
}

const uniqueViolationCode = "23505";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface RoutineRepository {
  listRoutines(): Promise<Routine[]>;
  getRoutine(id: string): Promise<Routine | null>;
  saveRoutine(id: string | null, input: unknown): Promise<string>;
  deleteRoutine(id: string): Promise<void>;
  createRoutineFromSession(sessionId: string, name: string): Promise<string>;
}

function toRepositoryError(error: { code?: string; message: string }) {
  return error.code === uniqueViolationCode
    ? new DuplicateRoutineNameError()
    : new RoutineRepositoryError(error.message);
}

async function requireAuthenticatedSupabase() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new RoutineRepositoryError("Authenticated user is required.");
  }

  return supabase;
}

async function loadRoutines(supabase: ServerSupabaseClient, routineId?: string) {
  let routineQuery = supabase.from("routines").select(routineColumns).order("name", { ascending: true });
  if (routineId) routineQuery = routineQuery.eq("id", routineId);

  const { data: routineData, error: routineError } = await routineQuery;
  if (routineError) throw new RoutineRepositoryError(routineError.message);

  const routines = (routineData ?? []) as RoutineRow[];
  if (routines.length === 0) return [];

  const { data: exerciseData, error: exerciseError } = await supabase
    .from("routine_exercises")
    .select(routineExerciseColumns)
    .in("routine_id", routines.map((routine) => routine.id));
  if (exerciseError) throw new RoutineRepositoryError(exerciseError.message);

  const exerciseRows = (exerciseData ?? []) as RoutineExerciseRow[];
  const exerciseIds = [...new Set(exerciseRows.map((row) => row.exercise_id))];

  const [{ data: setData, error: setError }, { data: nameData, error: nameError }] =
    await Promise.all([
      exerciseRows.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase
            .from("routine_exercise_sets")
            .select(routineExerciseSetColumns)
            .in("routine_exercise_id", exerciseRows.map((row) => row.id)),
      exerciseIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase.from("exercises").select("id, name").in("id", exerciseIds),
    ]);
  if (setError || nameError) {
    throw new RoutineRepositoryError((setError ?? nameError)?.message ?? "Failed to load routines.");
  }

  const exerciseNameById = new Map(
    ((nameData ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]),
  );

  return routines.map((routine) =>
    mapRoutineRows(
      routine,
      exerciseRows,
      (setData ?? []) as RoutineExerciseSetRow[],
      exerciseNameById,
    ),
  );
}

export async function createRoutineRepository(): Promise<RoutineRepository> {
  return {
    async listRoutines() {
      const supabase = await requireAuthenticatedSupabase();
      return loadRoutines(supabase);
    },

    async getRoutine(id) {
      const parsedId = routineIdSchema.safeParse(id);
      if (!parsedId.success) return null;

      const supabase = await requireAuthenticatedSupabase();
      const [routine] = await loadRoutines(supabase, parsedId.data);
      return routine ?? null;
    },

    async saveRoutine(id, input) {
      const routineId = id === null ? null : routineIdSchema.parse(id);
      const parsed = routineInputSchema.parse(input);
      const supabase = await requireAuthenticatedSupabase();
      const { data, error } = await supabase.rpc("save_routine", {
        target_routine_id: routineId,
        payload: parsed,
      });

      if (error || typeof data !== "string") {
        throw error ? toRepositoryError(error) : new RoutineRepositoryError("Failed to save routine.");
      }

      return data;
    },

    async deleteRoutine(id) {
      const routineId = routineIdSchema.parse(id);
      const supabase = await requireAuthenticatedSupabase();
      const { error } = await supabase.from("routines").delete().eq("id", routineId);

      if (error) throw new RoutineRepositoryError(error.message);
    },

    async createRoutineFromSession(sessionId, name) {
      const parsedSessionId = routineIdSchema.parse(sessionId);
      const parsedName = routineNameSchema.parse(name);
      const supabase = await requireAuthenticatedSupabase();
      const { data, error } = await supabase.rpc("create_routine_from_session", {
        source_session_id: parsedSessionId,
        routine_name: parsedName,
      });

      if (error || typeof data !== "string") {
        throw error
          ? toRepositoryError(error)
          : new RoutineRepositoryError("Failed to create routine from session.");
      }

      return data;
    },
  };
}
