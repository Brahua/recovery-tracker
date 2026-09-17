import { SignedOutLanding } from "@/components/signed-out-landing";
import { TodayOverview } from "@/features/today/overview";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData();

  if (!supabaseEnv || !user) {
    return (
      <SignedOutLanding
        errorMessage={error}
        showDemo={
          process.env.NODE_ENV !== "production" ||
          process.env.ENABLE_DEMO_MODE === "1"
        }
        supabaseEnv={Boolean(supabaseEnv)}
      />
    );
  }

  return (
    <TodayOverview
      recentCloseouts={recentCloseouts}
      recentSessions={recentSessions}
      user={user}
    />
  );
}
