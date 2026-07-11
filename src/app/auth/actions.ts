"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/supabase/urls";

export async function signInWithGoogleAction() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await buildAuthCallbackUrl("/"),
    },
  });

  if (error) {
    redirect("/auth/auth-code-error");
  }

  if (!data.url) {
    redirect("/auth/auth-code-error");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  redirect("/");
}
