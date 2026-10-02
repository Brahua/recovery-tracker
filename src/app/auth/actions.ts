"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/supabase/urls";

// A form may send account=choose to make Google show its account picker instead of reusing the
// signed-in account (used after an uninvited account is rejected).
export async function signInWithGoogleAction(formData?: FormData) {
  const supabase = await createServerSupabaseClient();
  const chooseAccount = formData?.get("account") === "choose";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await buildAuthCallbackUrl("/"),
      ...(chooseAccount ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });

  if (error) {
    console.error(
      `Google OAuth initiation failed: ${JSON.stringify({
        code: error.code,
        message: error.message,
        status: error.status,
      })}`,
    );
    redirect("/auth/auth-code-error?reason=initiation_failed");
  }

  if (!data.url) {
    console.error("Google OAuth initiation returned no redirect URL");
    redirect("/auth/auth-code-error?reason=initiation_failed");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  redirect("/");
}
