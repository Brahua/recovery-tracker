import { redirect } from "next/navigation";

import { HistoryList } from "@/features/history/history-list";
import {
  buildHistoryDays,
  getHistoryWindow,
} from "@/lib/history-view-model";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

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

  return (
    <HistoryList
      days={buildHistoryDays(recentSessions, recentCloseouts)}
      from={window.from}
      key={window.to}
      previousTo={window.previousTo}
      to={window.to}
    />
  );
}
