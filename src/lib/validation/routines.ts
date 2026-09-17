import { z } from "zod";

import { normalizeExerciseName } from "@/lib/exercise-name";

const routineSetSchema = z
  .object({
    position: z.number().int().nonnegative().max(99),
    reps: z.number().int().positive().max(1000).optional(),
    weightKg: z.number().nonnegative().max(1000).optional(),
    holdSeconds: z.number().int().positive().max(3600).optional(),
  })
  .refine(
    (set) =>
      set.reps !== undefined || set.weightKg !== undefined || set.holdSeconds !== undefined,
    "A routine set requires repetitions, weight, or hold seconds.",
  );

export const routineExerciseSchema = z
  .object({
    name: z.string().trim().min(1, "Exercise name is required.").max(80),
    exerciseId: z.uuid().optional(),
    isIsometric: z.boolean().default(false),
    durationMinutes: z.number().positive().max(1440).optional(),
    distanceKm: z.number().positive().max(1000).optional(),
    // A routine may leave the plan empty; it is completed when logging.
    sets: z.array(routineSetSchema).max(100),
  })
  .refine(
    (exercise) => exercise.isIsometric || exercise.sets.every((set) => set.reps !== undefined || set.weightKg !== undefined),
    "Hold seconds are only planned for isometric exercises.",
  )
  .transform((exercise) =>
    exercise.isIsometric
      ? exercise
      : { ...exercise, sets: exercise.sets.map((set) => ({ ...set, holdSeconds: undefined })) },
  );

export const routineNameSchema = z
  .string()
  .trim()
  .min(1, "Escribe un nombre para la rutina.")
  .max(60, "Usa como máximo 60 caracteres.");

export const routineInputSchema = z
  .object({
    name: routineNameSchema,
    exercises: z
      .array(routineExerciseSchema)
      .min(1, "Agrega al menos un ejercicio.")
      .max(20, "Una rutina admite hasta 20 ejercicios."),
  })
  .refine(
    (routine) => {
      const keys = routine.exercises.map(
        (exercise) => exercise.exerciseId ?? `name:${normalizeExerciseName(exercise.name)}`,
      );
      return new Set(keys).size === keys.length;
    },
    "La rutina tiene ejercicios repetidos.",
  );

export type RoutineInput = z.output<typeof routineInputSchema>;

export const routineIdSchema = z.uuid();
