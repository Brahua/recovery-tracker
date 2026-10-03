"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { demoProfiles, isDemoProfileId } from "@/lib/demo/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const unavailable = "El modo demo no está disponible por ahora.";

function backWithError(message: string): never {
  redirect(`/?error=${encodeURIComponent(message)}`);
}

// Signs the visitor in as one of the demo accounts (scripts/demo/reset-demo.mjs creates them).
// The accounts have no password and Google cannot reach them: the server asks Supabase for a
// one-time link with the service role and redeems it right away, so the session cookie is set
// without any email being sent. Only the three fixed emails can ever be requested.
export async function enterDemoAction(formData: FormData) {
  const profileId = formData.get("profile");
  if (!isDemoProfileId(profileId)) backWithError(unavailable);

  const admin = createAdminSupabaseClient();
  if (!admin) backWithError(unavailable);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: demoProfiles[profileId].email,
  });

  // generateLink creates a missing user: only an account prepared by the reset script is valid.
  if (
    error ||
    !data.properties?.hashed_token ||
    data.user?.app_metadata?.demo_profile !== profileId
  ) {
    console.error(
      `Demo sign-in link failed: ${JSON.stringify({ profileId, message: error?.message })}`,
    );
    backWithError(unavailable);
  }

  const supabase = await createServerSupabaseClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    console.error(
      `Demo sign-in failed: ${JSON.stringify({ profileId, message: verifyError.message })}`,
    );
    backWithError(unavailable);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
