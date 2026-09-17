import type { ExerciseDefaults } from "@/types/recovery";

export interface ExerciseSummaryInput {
  isIsometric: boolean;
  sets: Array<{ reps?: number; weightKg?: number; holdSeconds?: number }>;
  durationMinutes?: number;
  distanceKm?: number;
}

const numberFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function formatExerciseNumber(value: number) {
  return numberFormatter.format(value);
}

function defined(values: Array<number | undefined>) {
  return values.filter((value): value is number => value !== undefined);
}

function formatRange(values: number[], unit = "") {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const suffix = unit ? ` ${unit}` : "";

  return min === max
    ? `${formatExerciseNumber(min)}${suffix}`
    : `${formatExerciseNumber(min)}–${formatExerciseNumber(max)}${suffix}`;
}

function summarizeSets(input: ExerciseSummaryInput) {
  if (input.sets.length === 0) return "";

  const count = input.sets.length;
  const primary = input.isIsometric
    ? defined(input.sets.map((set) => set.holdSeconds))
    : defined(input.sets.map((set) => set.reps));
  const weights = defined(input.sets.map((set) => set.weightKg));
  const parts: string[] = [];

  if (primary.length > 0) {
    parts.push(`${count} × ${formatRange(primary, input.isIsometric ? "s" : "")}`);
  } else {
    parts.push(`${count} serie${count === 1 ? "" : "s"}`);
  }

  if (weights.length > 0 && Math.max(...weights) > 0) {
    parts.push(formatRange(weights, "kg"));
  }

  return parts.join(" · ");
}

export function summarizeExercise(input: ExerciseSummaryInput) {
  const parts = [summarizeSets(input)];

  if (input.durationMinutes !== undefined) {
    parts.push(`${formatExerciseNumber(input.durationMinutes)} min`);
  }

  if (input.distanceKm !== undefined) {
    parts.push(`${formatExerciseNumber(input.distanceKm)} km`);
  }

  return parts.filter(Boolean).join(" · ");
}

export function summarizeExerciseDefaults(defaults: ExerciseDefaults) {
  const setCount = defaults.defaultSetCount ?? 0;
  const set = {
    reps: defaults.defaultReps,
    weightKg: defaults.defaultWeightKg,
    holdSeconds: defaults.defaultHoldSeconds,
  };

  return summarizeExercise({
    isIsometric: defaults.defaultIsometric,
    sets: Array.from({ length: setCount }, () => set),
    durationMinutes: defaults.defaultDurationMinutes,
    distanceKm: defaults.defaultDistanceKm,
  });
}
