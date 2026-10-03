// Leaves the three demo accounts exactly as they were first published: creates them if they do not
// exist, wipes everything visitors added or changed, and loads the mock data again. Safe to run
// as often as you like (docs/specs/demo-mode-spec.md):
//
//   npm run demo:reset                    # the three profiles
//   npm run demo:reset -- --only knee     # one profile
//   npm run demo:reset -- --dry-run       # builds the data and prints counts, writes nothing
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (shell or .env.local). It only ever
// touches the accounts whose email is one of the demo profiles', never any other user.
import { randomUUID } from "node:crypto";

import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { demoProfileIds, demoProfiles } from "../../src/lib/demo/profiles.ts";
import { addDays, buildDemoDataset, limaToday } from "./seed-data.mjs";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex === -1 ? null : args[onlyIndex + 1];

if (only && !demoProfileIds.includes(only)) {
  console.error(`Unknown profile "${only}". Use one of: ${demoProfileIds.join(", ")}.`);
  process.exit(1);
}

const targets = only ? [only] : demoProfileIds;
const today = limaToday();

function fail(message) {
  console.error(message);
  process.exit(1);
}

let supabase = null;

if (!dryRun) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (shell or .env.local).");
  }
  supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  console.log(`Supabase: ${new URL(url).host}`);
}

function check(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function insertRows(table, rows) {
  for (let index = 0; index < rows.length; index += 400) {
    const { error } = await supabase.from(table).insert(rows.slice(index, index + 400));
    check(error, `insert into ${table}`);
  }
}

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    check(error, "list users");
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
}

// The access hook (invite-only) also guards accounts made with the admin API, so the email is on
// the allowlist only while the account is created.
async function createDemoUser(profile) {
  const { error: allowError } = await supabase
    .from("access_allowlist")
    .upsert({ email: profile.email, note: "Cuenta del modo demo" });
  check(allowError, "allow demo email");

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: profile.email,
      email_confirm: true,
    });
    check(error, `create ${profile.email}`);
    return data.user;
  } finally {
    await supabase.from("access_allowlist").delete().eq("email", profile.email);
  }
}

async function wipeUserData(userId) {
  // Sessions first: their exercises, sets and treatments cascade. Exercises are referenced by both
  // sessions and routines, so they go last.
  for (const table of [
    "rehab_sessions",
    "nightly_closeouts",
    "routines",
    "recovery_goals",
    "exercises",
    "push_subscriptions",
    "reminder_settings",
    "reminder_deliveries",
  ]) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    check(error, `wipe ${table}`);
  }
}

async function loadDataset(userId, data) {
  const exerciseIds = new Map(data.catalog.map((exercise) => [exercise.key, randomUUID()]));

  await insertRows(
    "exercises",
    data.catalog.map((exercise) => ({
      id: exerciseIds.get(exercise.key),
      user_id: userId,
      name: exercise.name,
      default_isometric: exercise.isIsometric,
      default_set_count: exercise.defaultSetCount ?? null,
      default_reps: exercise.defaultReps ?? null,
      default_hold_seconds: exercise.defaultHoldSeconds ?? null,
      default_weight_kg: exercise.defaultWeightKg ?? null,
      default_duration_minutes: exercise.defaultDurationMinutes ?? null,
      default_distance_km: exercise.defaultDistanceKm ?? null,
      archived_at: exercise.archived ? new Date().toISOString() : null,
    })),
  );

  const routines = [];
  const routineExercises = [];
  const routineSets = [];
  for (const routine of data.routines) {
    const routineId = randomUUID();
    routines.push({ id: routineId, user_id: userId, name: routine.name });
    for (const exercise of routine.exercises) {
      const routineExerciseId = randomUUID();
      routineExercises.push({
        id: routineExerciseId,
        routine_id: routineId,
        user_id: userId,
        exercise_id: exerciseIds.get(exercise.key),
        position: exercise.position,
        is_isometric: exercise.isIsometric,
        duration_minutes: exercise.durationMinutes ?? null,
        distance_km: exercise.distanceKm ?? null,
      });
      for (const set of exercise.sets) {
        routineSets.push({
          routine_exercise_id: routineExerciseId,
          user_id: userId,
          position: set.position,
          reps: set.reps ?? null,
          weight_kg: set.weightKg ?? null,
          hold_seconds: set.holdSeconds ?? null,
        });
      }
    }
  }
  await insertRows("routines", routines);
  await insertRows("routine_exercises", routineExercises);
  await insertRows("routine_exercise_sets", routineSets);

  const names = new Map(data.catalog.map((exercise) => [exercise.key, exercise.name]));
  const sessions = [];
  const sessionExercises = [];
  const sessionSets = [];
  const treatments = [];
  for (const session of data.sessions) {
    const sessionId = randomUUID();
    sessions.push({
      id: sessionId,
      user_id: userId,
      occurred_at: session.occurredAt,
      session_type: session.type,
      pain_before: session.painBefore,
      pain_during: session.painDuring,
      pain_after: session.painAfter,
      perceived_load: session.perceivedLoad,
      final_state: session.finalState,
      notes: session.notes ?? null,
      therapist_notes: session.therapistNotes ?? null,
    });
    for (const exercise of session.exercises) {
      const sessionExerciseId = randomUUID();
      sessionExercises.push({
        id: sessionExerciseId,
        session_id: sessionId,
        user_id: userId,
        position: exercise.position,
        name: names.get(exercise.key),
        exercise_id: exerciseIds.get(exercise.key),
        is_isometric: exercise.isIsometric,
        duration_minutes: exercise.durationMinutes ?? null,
        distance_km: exercise.distanceKm ?? null,
      });
      for (const set of exercise.sets) {
        sessionSets.push({
          session_exercise_id: sessionExerciseId,
          user_id: userId,
          position: set.position,
          reps: set.reps ?? null,
          weight_kg: set.weightKg ?? null,
          hold_seconds: set.holdSeconds ?? null,
        });
      }
    }
    for (const treatment of session.treatments) {
      treatments.push({
        session_id: sessionId,
        user_id: userId,
        position: treatment.position,
        category: treatment.category,
        modality: treatment.modality,
        body_zone: treatment.bodyZone ?? null,
        duration_minutes: treatment.minutes ?? null,
      });
    }
  }
  await insertRows("rehab_sessions", sessions);
  await insertRows("session_exercises", sessionExercises);
  await insertRows("session_exercise_sets", sessionSets);
  await insertRows("session_treatments", treatments);

  await insertRows(
    "nightly_closeouts",
    data.closeouts.map((closeout) => ({
      user_id: userId,
      date: closeout.date,
      end_of_day_pain: closeout.endOfDayPain,
      energy: closeout.energy,
      sleep_hours: closeout.sleepHours,
      sleep_quality: closeout.sleepQuality,
      rebound_pain_level: closeout.reboundPainLevel,
      stiffness_level: closeout.stiffnessLevel,
      closed_time: closeout.closedTime,
      notes: closeout.notes ?? null,
    })),
  );

  await insertRows(
    "recovery_goals",
    data.goals.map((goal) => ({
      user_id: userId,
      title: goal.title,
      created_at: goal.createdAt,
      achieved_at: goal.achievedAt,
    })),
  );
}

async function resetProfile(profileId) {
  const profile = demoProfiles[profileId];
  const data = buildDemoDataset(profileId, today);
  const counts = `${data.sessions.length} sesiones, ${data.closeouts.length} cierres, ${data.catalog.length} ejercicios, ${data.routines.length} rutinas, ${data.goals.length} metas`;

  if (dryRun) {
    console.log(`[dry-run] ${profile.title}: ${counts}`);
    return;
  }

  let user = await findUserByEmail(profile.email);
  const created = !user;
  if (!user) user = await createDemoUser(profile);

  await wipeUserData(user.id);

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { demo_profile: profileId },
    user_metadata: {
      display_name: profile.displayName,
      condition: {
        zone: profile.condition.zone,
        side: profile.condition.side,
        kind: profile.condition.kind,
        startedOn: addDays(today, -profile.condition.startedDaysAgo),
      },
      onboarding_completed_at: new Date().toISOString(),
      preferences: { theme: "dark", accent: "green" },
    },
  });
  check(error, `update ${profile.email}`);

  await loadDataset(user.id, data);
  console.log(`${created ? "Creado" : "Restablecido"} ${profile.title}: ${counts}`);
}

for (const profileId of targets) {
  try {
    await resetProfile(profileId);
  } catch (error) {
    fail(`No se pudo restablecer "${profileId}": ${error.message}`);
  }
}

console.log(dryRun ? "Dry run listo: no se escribió nada." : "Demo restablecida.");
