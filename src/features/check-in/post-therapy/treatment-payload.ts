import { z } from "zod";

import { maxTreatmentsPerSession } from "@/lib/treatments";
import { sessionTreatmentSchema } from "@/lib/validation/recovery";
import type { SessionTreatment } from "@/types/recovery";

const treatmentPayloadSchema = z
  .array(sessionTreatmentSchema)
  .max(maxTreatmentsPerSession, "Too many treatments for one session.");

export const invalidTreatmentPayloadMessage =
  "Revisa los tratamientos: completa o quita los que tengan datos incompletos.";

export function parseTreatmentPayload(value: string): SessionTreatment[] {
  if (!value) return [];

  try {
    return treatmentPayloadSchema.parse(JSON.parse(value));
  } catch {
    throw new Error(invalidTreatmentPayloadMessage);
  }
}
