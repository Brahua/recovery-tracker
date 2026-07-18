"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function testAuthEnabled() {
  // Dev by default; also honor ENABLE_DEMO_MODE=1 so E2E can use the demo flow
  // against a production build. This flag is only set in the CI e2e job, never on
  // the real Vercel deploy, so anonymous test auth stays disabled in production.
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_MODE === "1"
  );
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
