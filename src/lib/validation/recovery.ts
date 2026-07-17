import { z } from "zod";

import {
  exerciseShortcutIds,
  finalStates,
  painScores,
  rating1To5Values,
  reboundLevels,
  sessionTypes,
  type ExerciseShortcutId,
  type PainScore,
  type Rating1To5,
} from "@/types/recovery";

const isValidDateString = (value: string) => !Number.isNaN(Date.parse(value));

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const painScoreSchema: z.ZodType<PainScore> = z.custom<PainScore>(
  (value) => typeof value === "number" && painScores.includes(value as PainScore),
  { message: "Pain score must be an integer between 0 and 10." },
);

const rating1To5Schema: z.ZodType<Rating1To5> = z.custom<Rating1To5>(
  (value) =>
    typeof value === "number" && rating1To5Values.includes(value as Rating1To5),
  { message: "Rating must be an integer between 1 and 5." },
);

const sessionTypeSchema = z.enum(sessionTypes);
const finalStateSchema = z.enum(finalStates);
const reboundLevelSchema = z.enum(reboundLevels);
const exerciseShortcutIdSchema = z.enum(exerciseShortcutIds) as z.ZodType<ExerciseShortcutId>;

const requiredDateTimeSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine(isValidDateString, "Date must be parseable.");

const requiredDateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine(isValidDateString, "Date must be parseable.");

const optionalTextSchema = z.preprocess(
  normalizeOptionalText,
  z.string().max(500).optional(),
);

export const exerciseSetSchema = z
  .object({
    position: z.number().int().nonnegative().max(99),
    reps: z.number().int().positive().max(1000).optional(),
    weightKg: z.number().nonnegative().max(1000).optional(),
    notes: optionalTextSchema,
  })
  .refine(
    (set) =>
      set.reps !== undefined ||
      set.weightKg !== undefined ||
      set.notes !== undefined,
    "A set requires repetitions, weight, or a note.",
  );

export const sessionExerciseSchema = z
  .object({
    name: z.string().trim().min(1, "Exercise name is required."),
    shortcutId: exerciseShortcutIdSchema.optional(),
    durationMinutes: z.number().positive().max(1440).optional(),
    distanceKm: z.number().positive().max(1000).optional(),
    sets: z.array(exerciseSetSchema).max(100),
    notes: optionalTextSchema,
  })
  .refine(
    (exercise) =>
      exercise.sets.length > 0 ||
      exercise.durationMinutes !== undefined ||
      exercise.distanceKm !== undefined,
    "An exercise requires a set, duration, or distance.",
  )
  .refine(
    (exercise) =>
      new Set(exercise.sets.map((set) => set.position)).size ===
      exercise.sets.length,
    "Set positions must be unique within an exercise.",
  );

export const createRehabSessionInputSchema = z.object({
  occurredAt: requiredDateTimeSchema,
  sessionType: sessionTypeSchema,
  painBefore: painScoreSchema,
  painDuring: painScoreSchema.optional(),
  painAfter: painScoreSchema,
  perceivedLoad: rating1To5Schema,
  exercises: z
    .array(sessionExerciseSchema)
    .min(1, "At least one exercise is required.")
    .max(20, "Too many exercises for one session."),
  finalState: finalStateSchema,
  notes: optionalTextSchema,
});

export const createNightlyCloseoutInputSchema = z.object({
  date: requiredDateSchema,
  endOfDayPain: painScoreSchema,
  energy: rating1To5Schema,
  sleepHours: z.number().min(0).max(24),
  sleepQuality: rating1To5Schema,
  reboundPainLevel: reboundLevelSchema,
  notes: optionalTextSchema,
});

const persistedFieldsSchema = {
  id: z.string().trim().min(1),
  createdAt: requiredDateTimeSchema,
  updatedAt: requiredDateTimeSchema,
};

export const rehabSessionSchema = createRehabSessionInputSchema.extend(
  persistedFieldsSchema,
);

export const nightlyCloseoutSchema = createNightlyCloseoutInputSchema.extend(
  persistedFieldsSchema,
);
