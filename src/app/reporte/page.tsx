import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MedicalReport } from "@/features/reports/medical-report";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ReportePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedRange = resolvedSearchParams.range;
  const windowDays = requestedRange === "7" ? 7 : requestedRange === "14" ? 14 : 30;
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  return (
    <AppShell
      pathname="/reporte"
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={user}
    >
      <MedicalReport
        now={new Date().toISOString()}
        recentCloseouts={recentCloseouts}
        recentSessions={recentSessions}
        windowDays={windowDays}
      />
    </AppShell>
  );
}
