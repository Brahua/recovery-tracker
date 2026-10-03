import { SignedOutLanding } from "@/components/signed-out-landing";
import { createGoalsRepository } from "@/data/goals-repository";
import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { TodayOverview } from "@/features/today/overview";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabaseEnv, user, recentSessions, recentCloseouts } = await loadRecoveryPageData();

  if (!supabaseEnv || !user) {
    return (
      <SignedOutLanding
        errorMessage={error}
        showTestAuth={process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_MODE === "1"}
        supabaseEnv={Boolean(supabaseEnv)}
      />
    );
  }

  const [therapistNotes, goals] = await Promise.all([
    (await createRecoveryLogRepository()).getLatestTherapistNotes(),
    (await createGoalsRepository()).listGoals(),
  ]);

  return (
    <TodayOverview
      goals={goals}
      recentCloseouts={recentCloseouts}
      recentSessions={recentSessions}
      therapistNotes={therapistNotes}
      user={user}
    />
  );
}
