import {
  createNightlyCloseoutInputSchema,
  createRehabSessionInputSchema,
} from "@/lib/validation/recovery";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CreateNightlyCloseoutInput,
  CreateRehabSessionInput,
  DateRangeParams,
  NightlyCloseout,
  RehabSession,
  SessionExercise,
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

type SessionExerciseRow = {
  id: string;
  session_id: string;
  user_id: string;
  position: number;
  name: string;
  shortcut_id: SessionExercise["shortcutId"] | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
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

function mapExerciseRow(row: SessionExerciseRow): SessionExercise {
  return {
    name: row.name,
    shortcutId: row.shortcut_id ?? undefined,
    sets: row.sets ?? undefined,
    reps: row.reps ?? undefined,
    weight: row.weight ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function mapRehabSessionRow(
  row: RehabSessionRow,
  exercises: SessionExerciseRow[],
): RehabSession {
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
      .map(mapExerciseRow),
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

function toSessionInsertRow(userId: string, input: CreateRehabSessionInput) {
  return {
    user_id: userId,
    occurred_at: input.occurredAt,
    session_type: input.sessionType,
    pain_before: input.painBefore,
    pain_during: input.painDuring ?? null,
    pain_after: input.painAfter,
    perceived_load: input.perceivedLoad,
    final_state: input.finalState,
    notes: input.notes ?? null,
  };
}

function toSessionExerciseInsertRows(
  userId: string,
  sessionId: string,
  exercises: SessionExercise[],
) {
  return exercises.map((exercise, index) => ({
    session_id: sessionId,
    user_id: userId,
    position: index,
    name: exercise.name,
    shortcut_id: exercise.shortcutId ?? null,
    sets: exercise.sets ?? null,
    reps: exercise.reps ?? null,
    weight: exercise.weight ?? null,
    notes: exercise.notes ?? null,
  }));
}

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

async function requireAuthenticatedSupabase() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new RecoveryRepositoryError("Authenticated user is required.");
  }

  return { supabase, userId: user.id };
}

async function listSessionExercisesBySessionIds(
  sessionIds: string[],
): Promise<SessionExerciseRow[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const { supabase } = await requireAuthenticatedSupabase();
  const { data, error } = await supabase
    .from("session_exercises")
    .select(
      "id, session_id, user_id, position, name, shortcut_id, sets, reps, weight, notes, created_at, updated_at",
    )
    .in("session_id", sessionIds)
    .order("position", { ascending: true });

  if (error) {
    throw new RecoveryRepositoryError(error.message);
  }

  return (data ?? []) as SessionExerciseRow[];
}

export async function createRecoveryLogRepository(): Promise<RecoveryLogRepository> {
  return {
    async createRehabSession(input) {
      const parsed = createRehabSessionInputSchema.parse(input);
      const { supabase, userId } = await requireAuthenticatedSupabase();

      const { data: sessionData, error: sessionError } = await supabase
        .from("rehab_sessions")
        .insert(toSessionInsertRow(userId, parsed))
        .select(
          "id, user_id, occurred_at, session_type, pain_before, pain_during, pain_after, perceived_load, final_state, notes, created_at, updated_at",
        )
        .single();

      if (sessionError || !sessionData) {
        throw new RecoveryRepositoryError(
          sessionError?.message ?? "Failed to create rehab session.",
        );
      }

      const exerciseRows = toSessionExerciseInsertRows(
        userId,
        sessionData.id,
        parsed.exercises,
      );

      const { data: insertedExercises, error: exerciseError } = await supabase
        .from("session_exercises")
        .insert(exerciseRows)
        .select(
          "id, session_id, user_id, position, name, shortcut_id, sets, reps, weight, notes, created_at, updated_at",
        )
        .order("position", { ascending: true });

      if (exerciseError) {
        await supabase.from("rehab_sessions").delete().eq("id", sessionData.id);
        throw new RecoveryRepositoryError(exerciseError.message);
      }

      return mapRehabSessionRow(
        sessionData as RehabSessionRow,
        (insertedExercises ?? []) as SessionExerciseRow[],
      );
    },

    async listRehabSessions(params) {
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("rehab_sessions")
        .select(
          "id, user_id, occurred_at, session_type, pain_before, pain_during, pain_after, perceived_load, final_state, notes, created_at, updated_at",
        )
        .gte("occurred_at", `${params.from}T00:00:00.000Z`)
        .lte("occurred_at", `${params.to}T23:59:59.999Z`)
        .order("occurred_at", { ascending: false });

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      const sessions = (data ?? []) as RehabSessionRow[];
      const exercises = await listSessionExercisesBySessionIds(
        sessions.map((session) => session.id),
      );
      const exercisesBySessionId = new Map<string, SessionExerciseRow[]>();

      for (const exercise of exercises) {
        const list = exercisesBySessionId.get(exercise.session_id) ?? [];
        list.push(exercise);
        exercisesBySessionId.set(exercise.session_id, list);
      }

      return sessions.map((session) =>
        mapRehabSessionRow(
          session,
          exercisesBySessionId.get(session.id) ?? [],
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
