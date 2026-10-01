import { createExerciseEntry, type ExerciseEntryDraft } from "@/lib/exercise-entry-state";
import type { TreatmentDraft } from "@/lib/treatments";
import type { RehabSession, SessionExercise } from "@/types/recovery";

type NextId = (prefix: string) => string;

function toDraftValue(value: number | undefined) {
  return value === undefined ? "" : `${value}`;
}

// Records saved before individual sets kept "N series x reps x kg" in one row. Editing
// turns that into N equal sets so re-saving keeps the data instead of dropping it.
function legacySets(exercise: SessionExercise, nextId: NextId) {
  const legacy = exercise.legacyPrescription;
  if (!legacy || (legacy.reps === undefined && legacy.weightKg === undefined)) return [];

  return Array.from({ length: Math.max(1, legacy.setCount ?? 1) }, () => ({
    id: nextId("set"),
    reps: toDraftValue(legacy.reps),
    weightKg: toDraftValue(legacy.weightKg),
    holdSeconds: "",
    notes: "",
  }));
}

function sessionExerciseToEntry(exercise: SessionExercise, nextId: NextId): ExerciseEntryDraft {
  const isIsometric = exercise.isIsometric ?? false;

  return {
    ...createExerciseEntry(nextId("exercise"), exercise.name),
    exerciseId: exercise.exerciseId,
    isIsometric,
    durationMinutes: toDraftValue(exercise.durationMinutes),
    distanceKm: toDraftValue(exercise.distanceKm),
    sets:
      exercise.sets.length > 0
        ? exercise.sets.map((set) => ({
            id: nextId("set"),
            reps: toDraftValue(set.reps),
            weightKg: toDraftValue(set.weightKg),
            holdSeconds: isIsometric ? toDraftValue(set.holdSeconds) : "",
            notes: set.notes ?? "",
          }))
        : legacySets(exercise, nextId),
    notes: exercise.notes ?? "",
  };
}

// A saved session as the drafts the Registrar form edits; the historical exercise
// name is kept even if the catalog entry was renamed later.
export function sessionToExerciseEntries(session: RehabSession, nextId: NextId) {
  return session.exercises.map((exercise) => sessionExerciseToEntry(exercise, nextId));
}

export function sessionToTreatmentDrafts(session: RehabSession, nextId: NextId): TreatmentDraft[] {
  return session.treatments.map((treatment) => ({
    id: nextId("treatment"),
    category: treatment.category,
    modality: treatment.modality,
    customName: treatment.customName ?? "",
    bodyZone: treatment.bodyZone ?? "",
    durationMinutes: toDraftValue(treatment.durationMinutes),
  }));
}
