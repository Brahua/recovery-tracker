import { z } from "zod";

import { sessionExerciseSchema } from "@/lib/validation/recovery";
import type { SessionExercise } from "@/types/recovery";

const exercisePayloadSchema = z
  .array(sessionExerciseSchema)
  .min(1, "At least one exercise is required.")
  .max(20, "Too many exercises for one session.");

export function parseExercisePayload(value: string): SessionExercise[] {
  try {
    return exercisePayloadSchema.parse(JSON.parse(value));
  } catch {
    throw new Error("Los ejercicios enviados no son validos.");
  }
}
