import {
  applyExerciseDefaults,
  createExerciseEntry,
  resolveEntryExerciseId,
  toExercisePayload,
  type ExerciseEntryDraft,
} from "@/lib/exercise-entry-state";
import type { Exercise, Routine, RoutineExercise, SessionType } from "@/types/recovery";

type NextId = (prefix: string) => string;

function toDraftValue(value: number | undefined) {
  return value === undefined ? "" : `${value}`;
}

function hasPlan(item: RoutineExercise) {
  return (
    item.sets.length > 0 ||
    item.durationMinutes !== undefined ||
    item.distanceKm !== undefined
  );
}

export function routineExerciseToEntry(item: RoutineExercise, nextId: NextId): ExerciseEntryDraft {
  return {
    ...createExerciseEntry(nextId("exercise"), item.name),
    exerciseId: item.exerciseId,
    isIsometric: item.isIsometric,
    durationMinutes: toDraftValue(item.durationMinutes),
    distanceKm: toDraftValue(item.distanceKm),
    sets: item.sets.map((set) => ({
      id: nextId("set"),
      reps: toDraftValue(set.reps),
      weightKg: toDraftValue(set.weightKg),
      holdSeconds: toDraftValue(set.holdSeconds),
      notes: "",
    })),
  };
}

// Editing a routine shows exactly its plan, without catalog defaults.
export function routineToEntries(routine: Routine, nextId: NextId) {
  return routine.exercises.map((item) => routineExerciseToEntry(item, nextId));
}

export function addRoutineToSession(
  entries: ExerciseEntryDraft[],
  routine: Routine,
  catalog: Exercise[],
  nextId: NextId,
): { entries: ExerciseEntryDraft[]; added: number; skipped: number } {
  const used = new Set(
    entries.flatMap((entry) => resolveEntryExerciseId(entry, catalog) ?? []),
  );
  const additions = routine.exercises
    .filter((item) => !used.has(item.exerciseId))
    .map((item) => {
      const entry = routineExerciseToEntry(item, nextId);
      const exercise = catalog.find((candidate) => candidate.id === item.exerciseId);

      return !hasPlan(item) && exercise
        ? applyExerciseDefaults(entry, exercise, () => nextId("set"))
        : entry;
    });

  return {
    entries: [...entries, ...additions],
    added: additions.length,
    skipped: routine.exercises.length - additions.length,
  };
}

export function toRoutinePayload(name: string, entries: ExerciseEntryDraft[]) {
  return {
    name: name.trim(),
    exercises: toExercisePayload(entries).map((exercise) => ({
      name: exercise.name,
      exerciseId: exercise.exerciseId,
      isIsometric: exercise.isIsometric,
      durationMinutes: exercise.durationMinutes,
      distanceKm: exercise.distanceKm,
      sets: exercise.sets
        .filter(
          (set) =>
            set.reps !== undefined || set.weightKg !== undefined || set.holdSeconds !== undefined,
        )
        .map((set, position) => ({
          position,
          reps: set.reps,
          weightKg: set.weightKg,
          holdSeconds: set.holdSeconds,
        })),
    })),
  };
}

export function formatRoutineAddedMessage(routineName: string, added: number, skipped: number) {
  const addedText =
    added === 0
      ? `No se agregaron ejercicios de "${routineName}"`
      : added === 1
        ? `Se agregó 1 ejercicio de "${routineName}"`
        : `Se agregaron ${added} ejercicios de "${routineName}"`;
  const skippedText =
    skipped === 0 ? "" : ` · ${skipped} ya estaba${skipped === 1 ? "" : "n"}`;

  return `${addedText}${skippedText}`;
}

const sessionTypeNames: Record<SessionType, string> = {
  PHYSIOTHERAPY: "Fisio guiada",
  HOME: "En casa",
  HYDROTHERAPY: "Hidroterapia",
  GYM: "Gimnasio",
  WALK: "Caminata",
  OTHER: "Sesión",
};

const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function suggestRoutineName(sessionType: SessionType, occurredAt: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "numeric",
    timeZone,
  }).formatToParts(new Date(occurredAt));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");

  return `${sessionTypeNames[sessionType]} ${day} ${monthNames[month - 1]}`;
}
