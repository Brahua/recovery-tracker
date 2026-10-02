import { z } from "zod";

export const accessModes = ["invite_only", "open"] as const;

// The email someone will sign in with on Google. Stored trimmed and lowercased, like the allowlist.
export const inviteEmailSchema = z
  .string({ error: "Escribe un correo válido." })
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .email({ error: "Escribe un correo válido, por ejemplo nombre@gmail.com." })
      .max(254, { error: "El correo es demasiado largo." }),
  );

export const accessModeSchema = z.enum(accessModes, { error: "Modo de acceso no válido." });
