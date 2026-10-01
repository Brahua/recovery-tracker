import {
  exerciseSetColumns,
  mapSessionExerciseRow,
  mapSessionTreatmentRow,
  sessionExerciseColumns,
  sessionTreatmentColumns,
  type ExerciseSetRow,
  type SessionExerciseRow,
  type SessionTreatmentRow,
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
  LatestTherapistNotes,
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
  therapist_notes: string | null;
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
  getRehabSession(id: string): Promise<RehabSession | null>;
  updateRehabSession(id: string, input: CreateRehabSessionInput): Promise<RehabSession>;
  deleteRehabSession(id: string): Promise<void>;
  listRehabSessions(params: DateRangeParams): Promise<RehabSession[]>;
  getLatestTherapistNotes(): Promise<LatestTherapistNotes | null>;
  createNightlyCloseout(input: CreateNightlyCloseoutInput): Promise<NightlyCloseout>;
  getNightlyCloseout(id: string): Promise<NightlyCloseout | null>;
  updateNightlyCloseout(id: string, input: CreateNightlyCloseoutInput): Promise<NightlyCloseout>;
  deleteNightlyCloseout(id: string): Promise<void>;
  listNightlyCloseouts(params: DateRangeParams): Promise<NightlyCloseout[]>;
}

class RecoveryRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoveryRepositoryError";
  }
}

// The record does not exist or belongs to another user (RLS hides it).
export class RecordNotFoundError extends Error {
  constructor() {
    super("Record not found.");
    this.name = "RecordNotFoundError";
  }
}

// Another closeout already uses that date (unique user_id + date).
export class DuplicateCloseoutDateError extends Error {
  constructor() {
    super("Another closeout already uses that date.");
    this.name = "DuplicateCloseoutDateError";
  }
}

const uniqueViolationCode = "23505";
// Raised by update_rehab_session when the session is missing or not the caller's.
const noDataFoundCode = "P0002";

function mapRehabSessionRow(
  row: RehabSessionRow,
  exercises: SessionExerciseRow[],
  exerciseSets: ExerciseSetRow[],
  treatments: SessionTreatmentRow[],
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
      .map((exercise) => mapSessionExerciseRow(exercise, setsByExerciseId.get(exercise.id) ?? [])),
    finalState: row.final_state,
    notes: row.notes ?? undefined,
    treatments: treatments
      .slice()
      .sort((left, right) => left.position - right.position)
      .map(mapSessionTreatmentRow),
    therapistNotes: row.therapist_notes ?? undefined,
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

const nightlyCloseoutColumns =
  "id, user_id, date, end_of_day_pain, energy, sleep_hours, sleep_quality, rebound_pain_level, notes, created_at, updated_at";

const rehabSessionColumns =
  "id, user_id, occurred_at, session_type, pain_before, pain_during, pain_after, perceived_load, final_state, notes, therapist_notes, created_at, updated_at";

function toNightlyCloseoutRow(input: CreateNightlyCloseoutInput) {
  return {
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

async function listSessionTreatmentsBySessionIds(
  supabase: ServerSupabaseClient,
  sessionIds: string[],
): Promise<SessionTreatmentRow[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("session_treatments")
    .select(sessionTreatmentColumns)
    .in("session_id", sessionIds)
    .order("position", { ascending: true });

  if (error) {
    throw new RecoveryRepositoryError(error.message);
  }

  return (data ?? []) as SessionTreatmentRow[];
}

// One session with its children, or null when RLS hides it or it does not exist.
async function loadRehabSession(
  supabase: ServerSupabaseClient,
  sessionId: string,
): Promise<RehabSession | null> {
  const { data: sessionData, error: sessionError } = await supabase
    .from("rehab_sessions")
    .select(rehabSessionColumns)
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new RecoveryRepositoryError(sessionError.message);
  }

  if (!sessionData) {
    return null;
  }

  const [exercises, treatments] = await Promise.all([
    listSessionExercisesBySessionIds(supabase, [sessionId]),
    listSessionTreatmentsBySessionIds(supabase, [sessionId]),
  ]);
  const exerciseSets = await listExerciseSetsByExerciseIds(
    supabase,
    exercises.map((exercise) => exercise.id),
  );

  return mapRehabSessionRow(sessionData as RehabSessionRow, exercises, exerciseSets, treatments);
}

export async function createRecoveryLogRepository(): Promise<RecoveryLogRepository> {
  return {
    async createRehabSession(input) {
      const parsed = createRehabSessionInputSchema.parse(input);
      const { supabase } = await requireAuthenticatedSupabase();

      const { data: sessionId, error: createError } = await supabase.rpc("create_rehab_session", {
        payload: parsed,
      });

      if (createError || typeof sessionId !== "string") {
        throw new RecoveryRepositoryError(
          createError?.message ?? "Failed to create rehab session.",
        );
      }

      const session = await loadRehabSession(supabase, sessionId);

      if (!session) {
        throw new RecoveryRepositoryError("Failed to load the created rehab session.");
      }

      return session;
    },

    async getRehabSession(id) {
      const { supabase } = await requireAuthenticatedSupabase();
      return loadRehabSession(supabase, id);
    },

    async updateRehabSession(id, input) {
      const parsed = createRehabSessionInputSchema.parse(input);
      const { supabase } = await requireAuthenticatedSupabase();

      const { error: updateError } = await supabase.rpc("update_rehab_session", {
        target_session_id: id,
        payload: parsed,
      });

      if (updateError?.code === noDataFoundCode) {
        throw new RecordNotFoundError();
      }

      if (updateError) {
        throw new RecoveryRepositoryError(updateError.message);
      }

      const session = await loadRehabSession(supabase, id);

      if (!session) {
        throw new RecordNotFoundError();
      }

      return session;
    },

    async deleteRehabSession(id) {
      const { supabase } = await requireAuthenticatedSupabase();
      // Exercises, sets and treatments go with it (on delete cascade).
      const { data, error } = await supabase
        .from("rehab_sessions")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      if (!data || data.length === 0) {
        throw new RecordNotFoundError();
      }
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
      const sessionIds = sessions.map((session) => session.id);
      const [exercises, treatments] = await Promise.all([
        listSessionExercisesBySessionIds(supabase, sessionIds),
        listSessionTreatmentsBySessionIds(supabase, sessionIds),
      ]);
      const exerciseSets = await listExerciseSetsByExerciseIds(
        supabase,
        exercises.map((exercise) => exercise.id),
      );
      const exercisesBySessionId = new Map<string, SessionExerciseRow[]>();
      const setsByExerciseId = new Map<string, ExerciseSetRow[]>();
      const treatmentsBySessionId = new Map<string, SessionTreatmentRow[]>();

      for (const treatment of treatments) {
        const list = treatmentsBySessionId.get(treatment.session_id) ?? [];
        list.push(treatment);
        treatmentsBySessionId.set(treatment.session_id, list);
      }

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
          treatmentsBySessionId.get(session.id) ?? [],
        ),
      );
    },

    async getLatestTherapistNotes() {
      const { supabase } = await requireAuthenticatedSupabase();
      // The latest physio session decides: a newer one without notes clears them.
      const { data, error } = await supabase
        .from("rehab_sessions")
        .select("id, occurred_at, therapist_notes")
        .eq("session_type", "PHYSIOTHERAPY")
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      const row = data as Pick<RehabSessionRow, "id" | "occurred_at" | "therapist_notes"> | null;

      return row?.therapist_notes
        ? { sessionId: row.id, occurredAt: row.occurred_at, notes: row.therapist_notes }
        : null;
    },

    async createNightlyCloseout(input) {
      const parsed = createNightlyCloseoutInputSchema.parse(input);
      const { supabase, userId } = await requireAuthenticatedSupabase();

      const { data, error } = await supabase
        .from("nightly_closeouts")
        .insert({ user_id: userId, ...toNightlyCloseoutRow(parsed) })
        .select(nightlyCloseoutColumns)
        .single();

      if (error || !data) {
        throw new RecoveryRepositoryError(error?.message ?? "Failed to create nightly closeout.");
      }

      return mapNightlyCloseoutRow(data as NightlyCloseoutRow);
    },

    async getNightlyCloseout(id) {
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("nightly_closeouts")
        .select(nightlyCloseoutColumns)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      return data ? mapNightlyCloseoutRow(data as NightlyCloseoutRow) : null;
    },

    async updateNightlyCloseout(id, input) {
      const parsed = createNightlyCloseoutInputSchema.parse(input);
      const { supabase } = await requireAuthenticatedSupabase();

      const { data, error } = await supabase
        .from("nightly_closeouts")
        .update(toNightlyCloseoutRow(parsed))
        .eq("id", id)
        .select(nightlyCloseoutColumns)
        .maybeSingle();

      if (error?.code === uniqueViolationCode) {
        throw new DuplicateCloseoutDateError();
      }

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      if (!data) {
        throw new RecordNotFoundError();
      }

      return mapNightlyCloseoutRow(data as NightlyCloseoutRow);
    },

    async deleteNightlyCloseout(id) {
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("nightly_closeouts")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        throw new RecoveryRepositoryError(error.message);
      }

      if (!data || data.length === 0) {
        throw new RecordNotFoundError();
      }
    },

    async listNightlyCloseouts(params) {
      const { supabase } = await requireAuthenticatedSupabase();
      const { data, error } = await supabase
        .from("nightly_closeouts")
        .select(nightlyCloseoutColumns)
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
