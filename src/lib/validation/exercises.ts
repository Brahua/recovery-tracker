import { z } from "zod";

import type { ExerciseInput } from "@/types/recovery";

const optionalDraftNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    }
    return value;
  }, schema.optional());

export const exerciseInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Escribe un nombre.")
      .max(80, "Usa como máximo 80 caracteres."),
    defaultIsometric: z.boolean().default(false),
    defaultSetCount: optionalDraftNumber(
      z.number({ error: "Series inválidas." }).int("Series inválidas.").min(1, "Mínimo 1 serie.").max(20, "Máximo 20 series."),
    ),
    defaultReps: optionalDraftNumber(
      z.number({ error: "Repeticiones inválidas." }).int("Repeticiones inválidas.").min(1, "Mínimo 1 repetición.").max(1000),
    ),
    defaultHoldSeconds: optionalDraftNumber(
      z.number({ error: "Segundos inválidos." }).int("Segundos inválidos.").min(1, "Mínimo 1 segundo.").max(3600, "Máximo 3600 segundos."),
    ),
    defaultWeightKg: optionalDraftNumber(
      z.number({ error: "Peso inválido." }).min(0, "El peso no puede ser negativo.").max(1000),
    ),
    defaultDurationMinutes: optionalDraftNumber(
      z.number({ error: "Duración inválida." }).positive("La duración debe ser mayor a 0.").max(1440),
    ),
    defaultDistanceKm: optionalDraftNumber(
      z.number({ error: "Distancia inválida." }).positive("La distancia debe ser mayor a 0.").max(1000),
    ),
  })
  .transform(
    (input): ExerciseInput => ({
      ...input,
      defaultHoldSeconds: input.defaultIsometric ? input.defaultHoldSeconds : undefined,
    }),
  );

export const exerciseIdSchema = z.uuid();
