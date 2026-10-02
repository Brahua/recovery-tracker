"use server";

import { revalidatePath } from "next/cache";

import {
  AuthenticationRequiredError,
  requireAuthenticatedSupabase,
} from "@/lib/supabase/authenticated";
import { completeOnboardingSchema } from "@/lib/validation/onboarding";

export interface OnboardingActionResult {
  ok: boolean;
  error?: string;
}

// Saves the setup (or just the skip) and marks the onboarding as done, so the app stops sending
// this account to /bienvenida.
export async function completeOnboardingAction(input: unknown): Promise<OnboardingActionResult> {
  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const now = new Date().toISOString();
  const data =
    parsed.data.kind === "setup"
      ? {
          display_name: parsed.data.name,
          preferences: parsed.data.appearance,
          medical_notice_accepted_at: now,
          onboarding_completed_at: now,
        }
      : { onboarding_completed_at: now };

  try {
    const { supabase } = await requireAuthenticatedSupabase();
    const { error } = await supabase.auth.updateUser({ data });
    if (error) throw error;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        ok: false,
        error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.",
      };
    }
    console.error("Failed to complete onboarding.", error);
    return { ok: false, error: "No se pudo guardar. Intenta otra vez." };
  }

  // The (app) layout checks onboarding_completed_at; the greeting uses the new name.
  revalidatePath("/", "layout");
  return { ok: true };
}
