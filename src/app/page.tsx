import { AppShell } from "@/components/app-shell";
import { SignedOutLanding } from "@/components/signed-out-landing";
import { TodayOverview } from "@/features/today/overview";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

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
        showDemo={process.env.NODE_ENV !== "production"}
        supabaseEnv={Boolean(supabaseEnv)}
      />
    );
  }

  return (
    <AppShell
      pathname="/"
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={user}
    >
      <TodayOverview
        recentCloseouts={recentCloseouts}
        recentSessions={recentSessions}
        userEmail={user.email}
      />
    </AppShell>
  );
}
