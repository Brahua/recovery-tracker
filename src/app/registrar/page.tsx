import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DayClosedState } from "@/components/day-closed-state";
import { SessionSavedState } from "@/components/session-saved-state";
import { NightlyCloseoutForm } from "@/features/check-in/nightly-closeout/form";
import { PostTherapyForm } from "@/features/check-in/post-therapy/form";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import {
  buildCloseoutSuccessState,
  buildSessionSuccessState,
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
  const {
    supabaseEnv,
    user,
    recentSessions,
    recentCloseouts,
    hasSessionToday,
    hasCloseoutToday,
  } = await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

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
  const nightlyErrorMessage = getSingleSearchParam(
    resolvedSearchParams,
    "nightlyError",
  );
  const showSessionSuccess = mode === "session" && sessionSaved && !sessionErrorMessage;
  const showNightlySuccess = mode === "closeout" && nightlySaved && !nightlyErrorMessage;
  const successState = showSessionSuccess
    ? buildSessionSuccessState(hasCloseoutToday, sessionSuccessMessage)
    : showNightlySuccess
      ? buildCloseoutSuccessState(hasSessionToday, nightlySuccessMessage)
      : null;
  const streak = calculateLoggingStreak(recentSessions, recentCloseouts);
  const savedSession = resolveSavedSession(recentSessions, savedSessionId);
  const latestCloseout = recentCloseouts[0];
  const closeoutSession = latestCloseout
    ? recentSessions.find(
        (session) => getRecoveryDateKey(session.occurredAt) === latestCloseout.date,
      )
    : undefined;

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
      ) : showNightlySuccess && successState && latestCloseout ? (
        <DayClosedState
          {...successState}
          closeout={latestCloseout}
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
              latestSession={recentSessions[0]}
              recentCloseouts={recentCloseouts}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
