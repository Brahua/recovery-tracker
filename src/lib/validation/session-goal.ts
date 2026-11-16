import { z } from "zod";

import {
  SESSION_GOAL_DAYS_MAX,
  SESSION_GOAL_DAYS_MIN,
  SESSION_GOAL_PER_DAY_MAX,
  SESSION_GOAL_PER_DAY_MIN,
} from "@/lib/session-goal";

// What Ajustes and the onboarding send. Reading uses parseSessionGoal (lenient, with defaults).
export const sessionGoalSchema = z.object({
  perDay: z
    .number({ error: "Elige cuántas sesiones al día." })
    .int({ error: "Elige cuántas sesiones al día." })
    .min(SESSION_GOAL_PER_DAY_MIN, { error: "Elige entre 1 y 5 sesiones al día." })
    .max(SESSION_GOAL_PER_DAY_MAX, { error: "Elige entre 1 y 5 sesiones al día." }),
  daysPerWeek: z
    .number({ error: "Elige cuántos días a la semana." })
    .int({ error: "Elige cuántos días a la semana." })
    .min(SESSION_GOAL_DAYS_MIN, { error: "Elige entre 1 y 7 días a la semana." })
    .max(SESSION_GOAL_DAYS_MAX, { error: "Elige entre 1 y 7 días a la semana." }),
});

export type SessionGoalInput = z.input<typeof sessionGoalSchema>;
