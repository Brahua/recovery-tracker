import { z } from "zod";

export const DISPLAY_NAME_MAX_LENGTH = 30;

// What the user wants to be called ("Hola, …"). An empty value clears it, so the app falls back to
// the Google name or the email.
export const displayNameSchema = z
  .string({ error: "Escribe un nombre válido." })
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .refine(
    (value) => !/[\u0000-\u001F\u007F]/.test(value),
    "Usa solo letras, números y signos comunes.",
  )
  .refine(
    (value) => value.length <= DISPLAY_NAME_MAX_LENGTH,
    `Usa como máximo ${DISPLAY_NAME_MAX_LENGTH} caracteres.`,
  )
  .transform((value) => (value === "" ? null : value));
