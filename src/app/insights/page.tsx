import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { RecoveryDashboard } from "@/features/dashboard/overview";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const range = resolvedSearchParams.range === "all" ? "all" : "four-weeks";
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({
      from: range === "all" ? "2000-01-01" : undefined,
      limit: null,
    });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  return (
    <AppShell
      pathname="/insights"
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={user}
    >
      <RecoveryDashboard
        now={new Date().toISOString()}
        range={range}
        recentCloseouts={recentCloseouts}
        recentSessions={recentSessions}
      />
    </AppShell>
  );
}
