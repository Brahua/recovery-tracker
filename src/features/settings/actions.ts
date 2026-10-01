"use server";

import { revalidatePath } from "next/cache";

import { AuthenticationRequiredError, requireAuthenticatedSupabase } from "@/lib/supabase/authenticated";
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
      return { ok: false, error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente." };
    }
    console.error("Failed to save display name.", error);
    return { ok: false, error: genericError };
  }

  // The greeting (Hoy) and the sidebar name live in the (app) layout tree.
  revalidatePath("/", "layout");
  return { ok: true };
}
