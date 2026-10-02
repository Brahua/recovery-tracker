import { z } from "zod";

import { accents, themes } from "@/lib/appearance";

export const appearanceSchema = z.object(
  {
    theme: z.enum(themes, { error: "Tema no válido." }),
    accent: z.enum(accents, { error: "Color no válido." }),
  },
  { error: "Apariencia no válida." },
);
