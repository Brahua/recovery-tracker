import { z } from "zod";

import { appearanceSchema } from "@/lib/validation/appearance";
import { displayNameSchema } from "@/lib/validation/profile";

// Finishing the setup: name (empty keeps the Google name), appearance and the medical notice.
export const completeOnboardingSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("setup"),
    name: displayNameSchema,
    appearance: appearanceSchema,
    acceptedNotice: z.literal(true, {
      error: "Confirma que leíste el aviso para empezar.",
    }),
  }),
  // "Saltar": only marks the onboarding as done.
  z.object({ kind: z.literal("skip") }),
]);

export type CompleteOnboardingInput = z.input<typeof completeOnboardingSchema>;
