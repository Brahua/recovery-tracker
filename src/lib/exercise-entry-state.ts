import type { ExerciseShortcutId } from "@/types/recovery";

export interface ExerciseSetDraft {
  id: string;
  reps: string;
  weightKg: string;
  notes: string;
}

export interface ExerciseEntryDraft {
  id: string;
  name: string;
  shortcutId?: ExerciseShortcutId;
  durationMinutes: string;
  distanceKm: string;
  sets: ExerciseSetDraft[];
  notes: string;
}

export function createExerciseEntry(
  id: string,
  name: string,
  shortcutId?: ExerciseShortcutId,
): ExerciseEntryDraft {
  return {
    id,
    name,
    shortcutId,
    durationMinutes: "",
    distanceKm: "",
    sets: [],
    notes: "",
  };
}

export function addExerciseSet(
  exercise: ExerciseEntryDraft,
  setId: string,
): ExerciseEntryDraft {
  return {
    ...exercise,
    sets: [
      ...exercise.sets,
      { id: setId, reps: "", weightKg: "", notes: "" },
    ],
  };
}

export function updateExerciseSet(
  exercise: ExerciseEntryDraft,
  setId: string,
  changes: Partial<Omit<ExerciseSetDraft, "id">>,
): ExerciseEntryDraft {
  return {
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.id === setId ? { ...set, ...changes } : set,
    ),
  };
}

export function duplicateExerciseSet(
  exercise: ExerciseEntryDraft,
  setId: string,
  duplicateId: string,
): ExerciseEntryDraft {
  const source = exercise.sets.find((set) => set.id === setId);

  if (!source) {
    return exercise;
  }

  return {
    ...exercise,
    sets: [...exercise.sets, { ...source, id: duplicateId }],
  };
}

export function removeExerciseSet(
  exercise: ExerciseEntryDraft,
  setId: string,
): ExerciseEntryDraft {
  return {
    ...exercise,
    sets: exercise.sets.filter((set) => set.id !== setId),
  };
}

export function isExerciseEntryComplete(exercise: ExerciseEntryDraft) {
  return (
    exercise.durationMinutes.trim().length > 0 ||
    exercise.distanceKm.trim().length > 0 ||
    exercise.sets.some(
      (set) =>
        set.reps.trim().length > 0 ||
        set.weightKg.trim().length > 0 ||
        set.notes.trim().length > 0,
    )
  );
}

function parseNumericDraft(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function toExercisePayload(exercises: ExerciseEntryDraft[]) {
  return exercises.map((exercise) => ({
    name: exercise.name.trim(),
    shortcutId: exercise.shortcutId,
    durationMinutes: parseNumericDraft(exercise.durationMinutes),
    distanceKm: parseNumericDraft(exercise.distanceKm),
    sets: exercise.sets.map((set, position) => ({
      position,
      reps: parseNumericDraft(set.reps),
      weightKg: parseNumericDraft(set.weightKg),
      notes: optionalText(set.notes),
    })),
    notes: optionalText(exercise.notes),
  }));
}
