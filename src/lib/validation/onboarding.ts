import { z } from "zod";

import { appearanceSchema } from "@/lib/validation/appearance";
import { conditionSchema } from "@/lib/validation/condition";
import { displayNameSchema } from "@/lib/validation/profile";

// Finishing the setup: name (empty keeps the Google name), appearance, the injury (optional) and
// the medical notice.
export const completeOnboardingSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("setup"),
    name: displayNameSchema,
    appearance: appearanceSchema,
    // Optional: the injury the account follows. Left empty it can be set later in Ajustes.
    condition: conditionSchema.nullish(),
    acceptedNotice: z.literal(true, {
      error: "Confirma que leíste el aviso para empezar.",
    }),
  }),
  // "Saltar": only marks the onboarding as done.
  z.object({ kind: z.literal("skip") }),
]);

export type CompleteOnboardingInput = z.input<typeof completeOnboardingSchema>;
