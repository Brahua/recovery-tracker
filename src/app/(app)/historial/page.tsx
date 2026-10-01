import { redirect } from "next/navigation";

import { ToastOnMount } from "@/components/feedback/toast-on-mount";
import { HistoryList } from "@/features/history/history-list";
import { buildHistoryDays, getHistoryWindow } from "@/lib/history-view-model";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

type SearchParams = Record<string, string | string[] | undefined>;

// Set by the edit actions when they redirect back here.
const updatedToastMessages = new Map([
  ["closeout", "Cierre actualizado"],
  ["session", "Sesión actualizada"],
]);

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedEnd =
    typeof resolvedSearchParams.before === "string" ? resolvedSearchParams.before : undefined;
  const window = getHistoryWindow(requestedEnd);
  const { supabaseEnv, user, recentSessions, recentCloseouts } = await loadRecoveryPageData({
    from: window.from,
    to: window.to,
    limit: null,
  });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const updated = resolvedSearchParams.updated;
  const updatedToast = typeof updated === "string" ? updatedToastMessages.get(updated) : undefined;
  const updatedKey = resolvedSearchParams.key;
  const focusedSession = resolvedSearchParams.session;

  return (
    <>
      {updatedToast && typeof updatedKey === "string" ? (
        <ToastOnMount message={updatedToast} onceKey={`updated:${updatedKey}`} />
      ) : null}
      <HistoryList
        days={buildHistoryDays(recentSessions, recentCloseouts)}
        expandedSessionId={typeof focusedSession === "string" ? focusedSession : undefined}
        from={window.from}
        key={`${window.to}:${typeof updatedKey === "string" ? updatedKey : ""}`}
        previousTo={window.previousTo}
        to={window.to}
      />
    </>
  );
}
