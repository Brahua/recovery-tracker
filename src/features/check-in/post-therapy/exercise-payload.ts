import { z } from "zod";

import { sessionExerciseSchema } from "@/lib/validation/recovery";
import type { SessionExercise } from "@/types/recovery";

// The session schema decides whether an empty list is allowed (physio with treatments).
const exercisePayloadSchema = z
  .array(sessionExerciseSchema)
  .max(20, "Too many exercises for one session.");

export const invalidExercisePayloadMessage =
  "Completa o elimina todos los ejercicios seleccionados antes de guardar.";

export function parseExercisePayload(value: string): SessionExercise[] {
  try {
    return exercisePayloadSchema.parse(JSON.parse(value));
  } catch {
    throw new Error(invalidExercisePayloadMessage);
  }
}
