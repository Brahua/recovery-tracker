import {
  exerciseSetColumns,
  mapSessionExerciseRow,
  sessionExerciseColumns,
  type ExerciseSetRow,
  type SessionExerciseRow,
} from "@/data/recovery-log-mappers";
import {
  requireAuthenticatedSupabase,
  type ServerSupabaseClient,
} from "@/lib/supabase/authenticated";
import { getRecoveryUtcRange } from "@/lib/recovery-date";
import {
  createNightlyCloseoutInputSchema,
  createRehabSessionInputSchema,
} from "@/lib/validation/recovery";
import type {
  CreateNightlyCloseoutInput,
  CreateRehabSessionInput,
  DateRangeParams,
  NightlyCloseout,
  RehabSession,
} from "@/types/recovery";

type RehabSessionRow = {
  id: string;
  user_id: string;
  occurred_at: string;
  session_type: RehabSession["sessionType"];
  pain_before: RehabSession["painBefore"];
  pain_during: RehabSession["painDuring"] | null;
  pain_after: RehabSession["painAfter"];
  perceived_load: RehabSession["perceivedLoad"];
  final_state: RehabSession["finalState"];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type NightlyCloseoutRow = {
  id: string;
  user_id: string;
  date: string;
  end_of_day_pain: NightlyCloseout["endOfDayPain"];
  energy: NightlyCloseout["energy"];
  sleep_hours: number;
  sleep_quality: NightlyCloseout["sleepQuality"];
  rebound_pain_level: NightlyCloseout["reboundPainLevel"];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export interface RecoveryLogRepository {
  createRehabSession(input: CreateRehabSessionInput): Promise<RehabSession>;
  listRehabSessions(params: DateRangeParams): Promise<RehabSession[]>;
  createNightlyCloseout(
    input: CreateNightlyCloseoutInput,
  ): Promise<NightlyCloseout>;
  listNightlyCloseouts(params: DateRangeParams): Promise<NightlyCloseout[]>;
}

class RecoveryRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoveryRepositoryError";
  }
}

function mapRehabSessionRow(
  row: RehabSessionRow,
  exercises: SessionExerciseRow[],
  exerciseSets: ExerciseSetRow[],
): RehabSession {
  const setsByExerciseId = new Map<string, ExerciseSetRow[]>();

  for (const set of exerciseSets) {
    const list = setsByExerciseId.get(set.session_exercise_id) ?? [];
    list.push(set);
    setsByExerciseId.set(set.session_exercise_id, list);
  }

  return {
    id: row.id,
    occurredAt: row.occurred_at,
    sessionType: row.session_type,
    painBefore: row.pain_before,
    painDuring: row.pain_during ?? undefined,
    painAfter: row.pain_after,
    perceivedLoad: row.perceived_load,
    exercises: exercises
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((exercise) =>
        mapSessionExerciseRow(
          exercise,
          setsByExerciseId.get(exercise.id) ?? [],
        ),
      ),
    finalState: row.final_state,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNightlyCloseoutRow(row: NightlyCloseoutRow): NightlyCloseout {
  return {
    id: row.id,
    date: row.date,
    endOfDayPain: row.end_of_day_pain,
    energy: row.energy,
    sleepHours: row.sleep_hours,
    sleepQuality: row.sleep_quality,
    reboundPainLevel: row.rebound_pain_level,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const rehabSessionColumns =
  "id, user_id, occurred_at, session_type, pain_before, pain_during, pain_after, perceived_load, final_state, notes, created_at, updated_at";

function toNightlyCloseoutInsertRow(
  userId: string,
  input: CreateNightlyCloseoutInput,
) {
  return {
    user_id: userId,
    date: input.date,
    end_of_day_pain: input.endOfDayPain,
    energy: input.energy,
    sleep_hours: input.sleepHours,
    sleep_quality: input.sleepQuality,
    rebound_pain_level: input.reboundPainLevel,
    notes: input.notes ?? null,
  };
}

async function listSessionExercisesBySessionIds(
  supabase: ServerSupabaseClient,
  sessionIds: string[],
): Promise<SessionExerciseRow[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("session_exercises")
    .select(sessionExerciseColumns)
    .in("session_id", sessionIds)
    .order("position", { ascending: true });

  if (error) {
    throw new RecoveryRepositoryError(error.message);
  }

  return (data ?? []) as SessionExerciseRow[];
}

async function listExerciseSetsByExerciseIds(
  supabase: ServerSupabaseClient,
  exerciseIds: string[],
): Promise<ExerciseSetRow[]> {
  if (exerciseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("session_exercise_sets")
    .select(exerciseSetColumns)
    .in("session_exercise_id", exerciseIds)
    .order("position", { ascending: true });

  if (error) {
    throw new RecoveryRepositoryError(error.message);
  }

  return (data ?? []) as ExerciseSetRow[];
}

export async function createRecoveryLogRepository(): Promise<RecoveryLogRepository> {
  return {
    async createRehabSession(input) {
      const parsed = createRehabSessionInputSchema.parse(input);
      const { supabase } = await requireAuthenticatedSupabase();

      const { data: sessionId, error: createError } = await supabase.rpc(
        "create_rehab_session",
        { payload: parsed },
      );

      if (createError || typeof sessionId !== "string") {
        throw new RecoveryRepositoryError(
          createError?.message ?? "Failed to create rehab session.",
        );
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("rehab_sessions")
        .select(rehabSessionColumns)
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw new RecoveryRepositoryError(
          sessionError?.message ?? "Failed to load the created rehab session.",
        );
      }

      const exercises = await listSessionExercisesBySessionIds(supabase, [sessionId]);
      const exerciseSets = await listExerciseSetsByExerciseIds(
        supabase,
        exercises.map((exercise) => exercise.id),
      );

      return mapRehabSessionRow(sessionData as RehabSessionRow, exercises, exerciseSets);
    },

    async listRehabSessions(params) {
      const { supabase } = await requireAuthenticatedSupabase();
      const range = getRecoveryUtcRange(params.from, params.to);
      const { data, error } = await supabase
        .from("rehab_sessions")
        .select(rehabSessionColumns)
        .gte("occurred_at", range.fromInclusive)
        .lt("occurred_at", range.toExclusive)
        .order("occurred_at", { ascending: false });

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      const sessions = (data ?? []) as RehabSessionRow[];
      const exercises = await listSessionExercisesBySessionIds(
        supabase,
        sessions.map((session) => session.id),
      );
      const exerciseSets = await listExerciseSetsByExerciseIds(
        supabase,
        exercises.map((exercise) => exercise.id),
      );
      const exercisesBySessionId = new Map<string, SessionExerciseRow[]>();
      const setsByExerciseId = new Map<string, ExerciseSetRow[]>();

      for (const exercise of exercises) {
        const list = exercisesBySessionId.get(exercise.session_id) ?? [];
        list.push(exercise);
        exercisesBySessionId.set(exercise.session_id, list);
      }

      for (const set of exerciseSets) {
        const list = setsByExerciseId.get(set.session_exercise_id) ?? [];
        list.push(set);
        setsByExerciseId.set(set.session_exercise_id, list);
      }

      return sessions.map((session) =>
        mapRehabSessionRow(
          session,
          exercisesBySessionId.get(session.id) ?? [],
          (exercisesBySessionId.get(session.id) ?? []).flatMap(
            (exercise) => setsByExerciseId.get(exercise.id) ?? [],
          ),
        ),
      );
    },

    async createNightlyCloseout(input) {
      const parsed = createNightlyCloseoutInputSchema.parse(input);
      const { supabase, userId } = await requireAuthenticatedSupabase();

      const { data, error } = await supabase
        .from("nightly_closeouts")
        .insert(toNightlyCloseoutInsertRow(userId, parsed))
        .select(
          "id, user_id, date, end_of_day_pain, energy, sleep_hours, sleep_quality, rebound_pain_level, notes, created_at, updated_at",
        )
        .single();

      if (error || !data) {
        throw new RecoveryRepositoryError(
          error?.message ?? "Failed to create nightly closeout.",
        );
      }

      return mapNightlyCloseoutRow(data as NightlyCloseoutRow);
    },

    async listNightlyCloseouts(params) {
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("nightly_closeouts")
        .select(
          "id, user_id, date, end_of_day_pain, energy, sleep_hours, sleep_quality, rebound_pain_level, notes, created_at, updated_at",
        )
        .gte("date", params.from)
        .lte("date", params.to)
        .order("date", { ascending: false });

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      return ((data ?? []) as NightlyCloseoutRow[]).map(mapNightlyCloseoutRow);
    },
  };
}
