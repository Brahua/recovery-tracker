"use server";

import { revalidatePath } from "next/cache";

import { AccessDeniedError, createAccessRepository } from "@/data/access-repository";
import { AuthenticationRequiredError } from "@/lib/supabase/authenticated";
import { accessModeSchema, inviteEmailSchema } from "@/lib/validation/access";

export interface AccessActionResult {
  ok: boolean;
  error?: string;
  /** inviteEmailAction: false when the email was already on the list. */
  added?: boolean;
}

const sessionExpired = "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";
const notAdmin = "Solo la cuenta administradora puede cambiar el acceso.";

async function runAccessChange(
  change: () => Promise<Omit<AccessActionResult, "ok"> | void>,
  genericError: string,
): Promise<AccessActionResult> {
  try {
    const result = await change();
    revalidatePath("/ajustes");
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return { ok: false, error: sessionExpired };
    if (error instanceof AccessDeniedError) return { ok: false, error: notAdmin };
    console.error("Access change failed.", error);
    return { ok: false, error: genericError };
  }
}

export async function inviteEmailAction(input: unknown): Promise<AccessActionResult> {
  const parsed = inviteEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Escribe un correo válido." };
  }

  return runAccessChange(async () => {
    const added = await (await createAccessRepository()).invite(parsed.data);
    return { added };
  }, "No se pudo agregar la invitación. Intenta otra vez.");
}

export async function removeInviteAction(input: unknown): Promise<AccessActionResult> {
  const parsed = inviteEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Correo no válido." };

  return runAccessChange(async () => {
    await (await createAccessRepository()).remove(parsed.data);
  }, "No se pudo quitar la invitación. Intenta otra vez.");
}

export async function setAccessModeAction(input: unknown): Promise<AccessActionResult> {
  const parsed = accessModeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Modo de acceso no válido." };

  return runAccessChange(async () => {
    await (await createAccessRepository()).setMode(parsed.data);
  }, "No se pudo cambiar el modo de acceso. Intenta otra vez.");
}
