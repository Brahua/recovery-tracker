import { findExerciseByName, normalizeExerciseName } from "@/lib/exercise-name";
import type { ExerciseSummaryInput } from "@/lib/exercise-summary";
import type { Exercise } from "@/types/recovery";

type CatalogEntry = Pick<Exercise, "id" | "name" | "archivedAt">;

export interface ExerciseSetDraft {
  id: string;
  reps: string;
  weightKg: string;
  holdSeconds: string;
  notes: string;
}

export interface ExerciseEntryDraft {
  id: string;
  exerciseId?: string;
  name: string;
  isIsometric: boolean;
  durationMinutes: string;
  distanceKm: string;
  sets: ExerciseSetDraft[];
  notes: string;
}

export function createExerciseEntry(id: string, name = ""): ExerciseEntryDraft {
  return {
    id,
    name,
    isIsometric: false,
    durationMinutes: "",
    distanceKm: "",
    sets: [],
    notes: "",
  };
}

function toDraftValue(value: number | undefined) {
  return value === undefined ? "" : `${value}`;
}

export function applyExerciseDefaults(
  entry: ExerciseEntryDraft,
  exercise: Exercise,
  nextSetId: () => string,
): ExerciseEntryDraft {
  const hasSets = entry.sets.length > 0;
  const setCount = exercise.defaultSetCount ?? 0;

  return {
    ...entry,
    exerciseId: exercise.id,
    name: exercise.name,
    isIsometric: hasSets ? entry.isIsometric : exercise.defaultIsometric,
    durationMinutes:
      entry.durationMinutes || toDraftValue(exercise.defaultDurationMinutes),
    distanceKm: entry.distanceKm || toDraftValue(exercise.defaultDistanceKm),
    sets: hasSets
      ? entry.sets
      : Array.from({ length: setCount }, () => ({
          id: nextSetId(),
          reps: toDraftValue(exercise.defaultReps),
          weightKg: toDraftValue(exercise.defaultWeightKg),
          holdSeconds: toDraftValue(exercise.defaultHoldSeconds),
          notes: "",
        })),
  };
}

export function unlinkExerciseEntry(entry: ExerciseEntryDraft): ExerciseEntryDraft {
  return { ...entry, exerciseId: undefined, name: "" };
}

export function addExerciseSet(
  exercise: ExerciseEntryDraft,
  setId: string,
): ExerciseEntryDraft {
  return {
    ...exercise,
    sets: [
      ...exercise.sets,
      { id: setId, reps: "", weightKg: "", holdSeconds: "", notes: "" },
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

function hasText(value: string) {
  return value.trim().length > 0;
}

function isSetMeaningful(set: ExerciseSetDraft, isIsometric: boolean) {
  return (
    hasText(set.reps) ||
    hasText(set.weightKg) ||
    hasText(set.notes) ||
    (isIsometric && hasText(set.holdSeconds))
  );
}

export function isExerciseEntryEmpty(exercise: ExerciseEntryDraft) {
  return (
    !hasText(exercise.name) &&
    !hasText(exercise.durationMinutes) &&
    !hasText(exercise.distanceKm) &&
    !hasText(exercise.notes) &&
    !exercise.sets.some((set) => isSetMeaningful(set, true))
  );
}

export function isExerciseEntryComplete(exercise: ExerciseEntryDraft) {
  return (
    hasText(exercise.name) &&
    (hasText(exercise.durationMinutes) ||
      hasText(exercise.distanceKm) ||
      exercise.sets.some((set) => isSetMeaningful(set, exercise.isIsometric)))
  );
}

function parseNumericDraft(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
}

function parseSummaryNumber(value: string) {
  const parsed = parseNumericDraft(value);
  return typeof parsed === "number" ? parsed : undefined;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function toExerciseSummaryInput(exercise: ExerciseEntryDraft): ExerciseSummaryInput {
  return {
    isIsometric: exercise.isIsometric,
    sets: exercise.sets
      .filter((set) => isSetMeaningful(set, exercise.isIsometric))
      .map((set) => ({
        reps: parseSummaryNumber(set.reps),
        weightKg: parseSummaryNumber(set.weightKg),
        holdSeconds: exercise.isIsometric ? parseSummaryNumber(set.holdSeconds) : undefined,
      })),
    durationMinutes: parseSummaryNumber(exercise.durationMinutes),
    distanceKm: parseSummaryNumber(exercise.distanceKm),
  };
}

export function toExercisePayload(exercises: ExerciseEntryDraft[]) {
  return exercises.map((exercise) => ({
    name: exercise.name.trim(),
    exerciseId: exercise.exerciseId,
    isIsometric: exercise.isIsometric,
    durationMinutes: parseNumericDraft(exercise.durationMinutes),
    distanceKm: parseNumericDraft(exercise.distanceKm),
    sets: exercise.sets.map((set, position) => ({
      position,
      reps: parseNumericDraft(set.reps),
      weightKg: parseNumericDraft(set.weightKg),
      holdSeconds: exercise.isIsometric ? parseNumericDraft(set.holdSeconds) : undefined,
      notes: optionalText(set.notes),
    })),
    notes: optionalText(exercise.notes),
  }));
}

// Catalog id the server will link this entry to (by id, or by typed name).
export function resolveEntryExerciseId(entry: ExerciseEntryDraft, catalog: CatalogEntry[]) {
  return entry.exerciseId ?? findExerciseByName(catalog, entry.name)?.id;
}

// Entries that repeat an earlier exercise of the same session.
export function findRepeatedEntryIds(entries: ExerciseEntryDraft[], catalog: CatalogEntry[]) {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const entry of entries) {
    const exerciseId = resolveEntryExerciseId(entry, catalog);
    const normalizedName = normalizeExerciseName(entry.name);
    const key = exerciseId ?? (normalizedName ? `name:${normalizedName}` : undefined);
    if (!key) continue;

    if (seen.has(key)) repeated.add(entry.id);
    seen.add(key);
  }

  return repeated;
}

export type ExerciseEditorMode = "session" | "routine";

// A routine may leave the plan for later; a session needs something logged.
export function isEntryReady(entry: ExerciseEntryDraft, mode: ExerciseEditorMode) {
  return mode === "routine" ? hasText(entry.name) : isExerciseEntryComplete(entry);
}
