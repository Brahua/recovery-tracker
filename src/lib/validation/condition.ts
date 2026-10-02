import { z } from "zod";

import {
  bodyZones,
  conditionKinds,
  conditionSides,
  isSidedZone,
  isValidStartedOn,
  type Condition,
} from "@/lib/condition";

// What the form sends. An empty side or date means "not given".
export const conditionSchema = z
  .object({
    zone: z.enum(bodyZones, { error: "Elige la zona del cuerpo." }),
    side: z.enum(conditionSides, { error: "Lado no válido." }).nullish(),
    kind: z.enum(conditionKinds, { error: "Elige qué te pasó." }),
    startedOn: z
      .string({ error: "Fecha no válida." })
      .nullish()
      .transform((value) => (value ? value : null)),
  })
  .superRefine((value, context) => {
    if (value.startedOn && !isValidStartedOn(value.startedOn)) {
      context.addIssue({
        code: "custom",
        message: "La fecha no puede ser futura ni inválida.",
        path: ["startedOn"],
      });
    }
  })
  .transform((value): Condition => {
    const condition: Condition = { zone: value.zone, kind: value.kind };
    // A zone that does not come in pairs never keeps a side.
    if (isSidedZone(value.zone) && value.side) condition.side = value.side;
    if (value.startedOn) condition.startedOn = value.startedOn;
    return condition;
  });

/** Reads user_metadata.condition. Anything invalid counts as "no condition". */
export function parseCondition(raw: unknown): Condition | null {
  if (!raw) return null;
  const parsed = conditionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type ConditionInput = z.input<typeof conditionSchema>;
