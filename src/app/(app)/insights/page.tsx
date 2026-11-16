import { redirect } from "next/navigation";

import { RecoveryDashboard } from "@/features/dashboard/overview";
import { toDailySignals } from "@/lib/daily-signals";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const range = resolvedSearchParams.range === "all" ? "all" : "four-weeks";
  const { supabaseEnv, user, recentSessions, recentCloseouts, rangeCheckins } =
    await loadRecoveryPageData({
      from: range === "all" ? "2000-01-01" : undefined,
      limit: null,
    });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  return (
    <RecoveryDashboard
      now={new Date().toISOString()}
      range={range}
      recentSessions={recentSessions}
      signals={toDailySignals(recentCloseouts, rangeCheckins)}
    />
  );
}
