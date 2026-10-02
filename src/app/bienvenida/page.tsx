import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppearanceSync } from "@/components/appearance/appearance-sync";
import { Onboarding } from "@/features/onboarding/onboarding";
import { appearanceFromMetadata } from "@/lib/appearance";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getChosenDisplayName, getUserDisplayName } from "@/lib/user-display-name";

export const metadata: Metadata = { title: "Bienvenida · Recovery Tracker" };

// Outside the (app) group so the tour has no tab bar or sidebar.
export default async function BienvenidaPage({
  searchParams,
}: {
  searchParams: Promise<{ recorrido?: string }>;
}) {
  const { recorrido } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const completed = hasCompletedOnboarding(user.user_metadata);
  const replay = recorrido === "1";
  if (completed && !replay) redirect("/");

  const identity = { email: user.email, user_metadata: user.user_metadata };
  const appearance = appearanceFromMetadata(user.user_metadata);

  return (
    <>
      <AppearanceSync accent={appearance.accent} theme={appearance.theme} />
      <Onboarding
        appearance={appearance}
        chosenName={getChosenDisplayName(identity)}
        fallbackName={getUserDisplayName({
          ...identity,
          user_metadata: { ...user.user_metadata, display_name: null },
        })}
        mode={completed ? "replay" : "first"}
      />
    </>
  );
}
