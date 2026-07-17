import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DayClosedState } from "@/components/day-closed-state";
import { SessionSavedState } from "@/components/session-saved-state";
import { NightlyCloseoutForm } from "@/features/check-in/nightly-closeout/form";
import { PostTherapyForm } from "@/features/check-in/post-therapy/form";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { getCloseoutDateError } from "@/lib/closeout-date";
import {
  buildCloseoutSuccessState,
  buildSessionSuccessState,
  resolveSavedCloseout,
  resolveSavedSession,
  resolveRegistrarMode,
} from "@/lib/registrar-flow";
import { calculateLoggingStreak } from "@/lib/today-view-model";
import { getRecoveryDateKey } from "@/lib/recovery-date";

type SearchParams = Record<string, string | string[] | undefined>;

function getSingleSearchParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function RegistrarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageData = await loadRecoveryPageData({ limit: null });
  const {
    supabaseEnv,
    user,
    recentSessions,
    recentCloseouts,
    hasSessionToday,
    hasCloseoutToday,
  } = pageData;

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const today = getRecoveryDateKey();
  const requestedCloseoutDate = getSingleSearchParam(resolvedSearchParams, "date");
  const selectedCloseoutDate =
    requestedCloseoutDate &&
    !getCloseoutDateError(requestedCloseoutDate, today)
      ? requestedCloseoutDate
      : today;
  const selectedDayData =
    selectedCloseoutDate === today
      ? pageData
      : await loadRecoveryPageData({
          from: selectedCloseoutDate,
          limit: null,
          to: selectedCloseoutDate,
        });
  const selectedSession = selectedDayData.recentSessions.find(
    (session) => getRecoveryDateKey(session.occurredAt) === selectedCloseoutDate,
  );
  const selectedCloseout = selectedDayData.recentCloseouts.find(
    (closeout) => closeout.date === selectedCloseoutDate,
  );

  const requestedMode = getSingleSearchParam(resolvedSearchParams, "mode");
  const mode = resolveRegistrarMode(
    requestedMode,
    hasSessionToday,
    hasCloseoutToday,
  );
  const sessionSuccessMessage = getSingleSearchParam(
    resolvedSearchParams,
    "sessionSummary",
  );
  const sessionSaved = getSingleSearchParam(resolvedSearchParams, "sessionSaved") === "1";
  const savedSessionId = getSingleSearchParam(resolvedSearchParams, "sessionId");
  const sessionErrorMessage = getSingleSearchParam(
    resolvedSearchParams,
    "sessionError",
  );
  const nightlySuccessMessage = getSingleSearchParam(
    resolvedSearchParams,
    "nightlySummary",
  );
  const nightlySaved = getSingleSearchParam(resolvedSearchParams, "nightlySaved") === "1";
  const savedCloseoutId = getSingleSearchParam(resolvedSearchParams, "closeoutId");
  const nightlyErrorMessage = getSingleSearchParam(
    resolvedSearchParams,
    "nightlyError",
  );
  const showSessionSuccess = mode === "session" && sessionSaved && !sessionErrorMessage;
  const showNightlySuccess = mode === "closeout" && nightlySaved && !nightlyErrorMessage;
  const streak = calculateLoggingStreak(recentSessions, recentCloseouts);
  const savedSession = resolveSavedSession(recentSessions, savedSessionId);
  const savedCloseout = resolveSavedCloseout(
    [...recentCloseouts, ...selectedDayData.recentCloseouts],
    savedCloseoutId,
  );
  const closeoutSession = savedCloseout
    ? [...recentSessions, ...selectedDayData.recentSessions].find(
        (session) => getRecoveryDateKey(session.occurredAt) === savedCloseout.date,
      )
    : undefined;
  const successState = showSessionSuccess
    ? buildSessionSuccessState(hasCloseoutToday, sessionSuccessMessage)
    : showNightlySuccess
      ? buildCloseoutSuccessState(Boolean(closeoutSession), nightlySuccessMessage)
      : null;

  return (
    <AppShell
      immersive={showSessionSuccess || showNightlySuccess}
      pathname="/registrar"
      streak={streak}
      user={user}
    >
      {showSessionSuccess && successState ? (
        <SessionSavedState
          {...successState}
          hasCloseoutToday={hasCloseoutToday}
          session={savedSession}
          streak={streak}
        />
      ) : showNightlySuccess && successState && savedCloseout ? (
        <DayClosedState
          {...successState}
          closeout={savedCloseout}
          session={closeoutSession}
          streak={streak}
        />
      ) : (
        <div>
          {mode === "session" ? (
          <PostTherapyForm
            defaultOccurredAt={new Date().toISOString()}
            errorMessage={sessionErrorMessage}
            recentSessions={recentSessions}
          />
          ) : (
            <NightlyCloseoutForm
              defaultOccurredAt={new Date().toISOString()}
              errorMessage={nightlyErrorMessage}
              recentCloseouts={recentCloseouts}
              selectedCloseout={selectedCloseout}
              selectedDate={selectedCloseoutDate}
              selectedSession={selectedSession}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
