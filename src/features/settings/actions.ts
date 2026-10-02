"use server";

import { revalidatePath } from "next/cache";

import {
  AuthenticationRequiredError,
  requireAuthenticatedSupabase,
} from "@/lib/supabase/authenticated";
import { appearanceSchema } from "@/lib/validation/appearance";
import { conditionSchema } from "@/lib/validation/condition";
import { displayNameSchema } from "@/lib/validation/profile";

export interface ProfileActionResult {
  ok: boolean;
  error?: string;
}

const genericError = "No se pudo guardar tu nombre. Intenta otra vez.";

// Saves what the user wants to be called in user_metadata.display_name (a key Google never writes,
// unlike full_name). An empty value stores null, which falls back to the Google name.
export async function saveDisplayNameAction(input: unknown): Promise<ProfileActionResult> {
  const parsed = displayNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericError };
  }

  try {
    const { supabase } = await requireAuthenticatedSupabase();
    const { error } = await supabase.auth.updateUser({ data: { display_name: parsed.data } });
    if (error) throw error;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        ok: false,
        error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.",
      };
    }
    console.error("Failed to save display name.", error);
    return { ok: false, error: genericError };
  }

  // The greeting (Hoy) and the sidebar name live in the (app) layout tree.
  revalidatePath("/", "layout");
  return { ok: true };
}

// Saves the theme and accent in user_metadata.preferences, so every device follows the account.
// The browser already applied the change and wrote the cookie (applyAppearance).
export async function saveAppearanceAction(input: unknown): Promise<ProfileActionResult> {
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Apariencia no válida." };
  }

  try {
    const { supabase } = await requireAuthenticatedSupabase();
    const { error } = await supabase.auth.updateUser({ data: { preferences: parsed.data } });
    if (error) throw error;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        ok: false,
        error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.",
      };
    }
    console.error("Failed to save appearance.", error);
    return { ok: false, error: "No se pudo guardar la apariencia. Intenta otra vez." };
  }

  return { ok: true };
}

// Saves the injury the account follows in user_metadata.condition. null removes it (the app goes
// back to the neutral wording).
export async function saveConditionAction(input: unknown): Promise<ProfileActionResult> {
  let condition = null;
  if (input !== null) {
    const parsed = conditionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
    }
    condition = parsed.data;
  }

  try {
    const { supabase } = await requireAuthenticatedSupabase();
    const { error } = await supabase.auth.updateUser({ data: { condition } });
    if (error) throw error;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        ok: false,
        error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.",
      };
    }
    console.error("Failed to save condition.", error);
    return { ok: false, error: "No se pudo guardar. Intenta otra vez." };
  }

  // Hoy, Registrar and Reporte word their text from the condition.
  revalidatePath("/", "layout");
  return { ok: true };
}
