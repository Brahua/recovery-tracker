"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function testAuthEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function signInAnonymouslyForTestingAction() {
  if (!testAuthEnabled()) {
    redirect("/?error=Auth de prueba no disponible.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  redirect("/");
}
