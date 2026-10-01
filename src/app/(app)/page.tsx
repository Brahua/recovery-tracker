import { SignedOutLanding } from "@/components/signed-out-landing";
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
        showDemo={process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_MODE === "1"}
        supabaseEnv={Boolean(supabaseEnv)}
      />
    );
  }

  const therapistNotes = await (await createRecoveryLogRepository()).getLatestTherapistNotes();

  return (
    <TodayOverview
      recentCloseouts={recentCloseouts}
      recentSessions={recentSessions}
      therapistNotes={therapistNotes}
      user={user}
    />
  );
}
