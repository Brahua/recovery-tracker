import { z } from "zod";

export const GOAL_TITLE_MIN_LENGTH = 3;
export const GOAL_TITLE_MAX_LENGTH = 80;

// A goal in the patient's own words ("subir escaleras sin dolor").
export const goalTitleSchema = z
  .string({ error: "Escribe tu meta." })
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .refine(
    (value) => !/[\u0000-\u001F\u007F]/.test(value),
    "Usa solo letras, números y signos comunes.",
  )
  .refine(
    (value) => value.length >= GOAL_TITLE_MIN_LENGTH,
    `Escribe al menos ${GOAL_TITLE_MIN_LENGTH} letras.`,
  )
  .refine(
    (value) => value.length <= GOAL_TITLE_MAX_LENGTH,
    `Usa como máximo ${GOAL_TITLE_MAX_LENGTH} caracteres.`,
  );

export const goalIdSchema = z.uuid();
