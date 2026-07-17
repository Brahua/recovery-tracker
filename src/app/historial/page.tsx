import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { HistoryList } from "@/features/history/history-list";
import {
  buildHistoryDays,
  getHistoryWindow,
} from "@/lib/history-view-model";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";
import { getRecoveryDateKey } from "@/lib/recovery-date";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedEnd = typeof resolvedSearchParams.before === "string"
    ? resolvedSearchParams.before
    : undefined;
  const window = getHistoryWindow(requestedEnd);
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({
      from: window.from,
      to: window.to,
      limit: null,
    });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const currentActivity = window.to === getRecoveryDateKey()
    ? { sessions: recentSessions, closeouts: recentCloseouts }
    : await loadRecoveryPageData({ limit: null }).then((data) => ({
        sessions: data.recentSessions,
        closeouts: data.recentCloseouts,
      }));

  return (
    <AppShell
      pathname="/historial"
      streak={calculateLoggingStreak(
        currentActivity.sessions,
        currentActivity.closeouts,
      )}
      user={user}
    >
      <HistoryList
        days={buildHistoryDays(recentSessions, recentCloseouts)}
        from={window.from}
        previousTo={window.previousTo}
        to={window.to}
      />
    </AppShell>
  );
}
