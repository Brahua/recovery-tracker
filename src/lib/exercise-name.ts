import type { Exercise } from "@/types/recovery";

type NamedExercise = Pick<Exercise, "id" | "name" | "archivedAt">;
type RankedExercise = Pick<Exercise, "id" | "name" | "archivedAt" | "sessionCount">;

// Must stay in sync with public.normalize_exercise_name in the exercise catalog migration.
export function normalizeExerciseName(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isActive(exercise: NamedExercise) {
  return !exercise.archivedAt;
}

export function matchExercises<T extends NamedExercise>(
  exercises: T[],
  query: string,
  { excludeIds = [], limit = 8 }: { excludeIds?: string[]; limit?: number } = {},
): T[] {
  const normalizedQuery = normalizeExerciseName(query);
  if (!normalizedQuery) return [];

  const excluded = new Set(excludeIds);
  const prefixMatches: T[] = [];
  const containsMatches: T[] = [];

  for (const exercise of exercises) {
    if (!isActive(exercise) || excluded.has(exercise.id)) continue;

    const normalizedName = normalizeExerciseName(exercise.name);
    if (normalizedName.startsWith(normalizedQuery)) {
      prefixMatches.push(exercise);
    } else if (normalizedName.includes(normalizedQuery)) {
      containsMatches.push(exercise);
    }
  }

  const byName = (left: T, right: T) => left.name.localeCompare(right.name, "es");

  return [...prefixMatches.sort(byName), ...containsMatches.sort(byName)].slice(0, limit);
}

export function findExerciseByName<T extends NamedExercise>(exercises: T[], name: string) {
  const normalizedName = normalizeExerciseName(name);
  if (!normalizedName) return undefined;

  return exercises.find(
    (exercise) => normalizeExerciseName(exercise.name) === normalizedName,
  );
}

export function selectMostUsedExercises<T extends RankedExercise>(
  exercises: T[],
  limit = 8,
): T[] {
  return exercises
    .filter(isActive)
    .slice()
    .sort((left, right) => {
      if (right.sessionCount !== left.sessionCount) {
        return right.sessionCount - left.sessionCount;
      }

      return left.name.localeCompare(right.name, "es");
    })
    .slice(0, limit);
}
