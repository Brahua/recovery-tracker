import { z } from "zod";

import { defaultSessionGoal } from "@/lib/session-goal";
import { appearanceSchema } from "@/lib/validation/appearance";
import { conditionSchema } from "@/lib/validation/condition";
import { displayNameSchema } from "@/lib/validation/profile";
import { sessionGoalSchema } from "@/lib/validation/session-goal";

// Finishing the setup: name (empty keeps the Google name), appearance, the injury (optional), the
// session goal and the medical notice.
export const completeOnboardingSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("setup"),
    name: displayNameSchema,
    appearance: appearanceSchema,
    // Optional: the injury the account follows. Left empty it can be set later in Ajustes.
    condition: conditionSchema.nullish(),
    // How many sessions a day and days a week (1 session, every day if not sent).
    sessionGoal: sessionGoalSchema.default({ ...defaultSessionGoal }),
    acceptedNotice: z.literal(true, {
      error: "Confirma que leíste el aviso para empezar.",
    }),
  }),
  // "Saltar": only marks the onboarding as done.
  z.object({ kind: z.literal("skip") }),
]);

export type CompleteOnboardingInput = z.input<typeof completeOnboardingSchema>;
