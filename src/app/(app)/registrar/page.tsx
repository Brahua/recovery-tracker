import { redirect } from "next/navigation";

import { ImmersiveMarker } from "@/components/app-shell";
import { ToastOnMount } from "@/components/feedback/toast-on-mount";
import { MorningSavedState } from "@/components/morning-saved-state";
import { SessionSavedState } from "@/components/session-saved-state";
import { MorningCheckinForm } from "@/features/check-in/morning-checkin/form";
import { PostTherapyForm } from "@/features/check-in/post-therapy/form";
import { parseCondition } from "@/lib/validation/condition";
import { loadExerciseLibrary } from "@/lib/exercise-library";
import { getMorningCheckinDateError } from "@/lib/morning-checkin-date";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import {
  buildMorningSuccessState,
  buildSessionSuccessState,
  resolveSavedSession,
  resolveRegistrarMode,
} from "@/lib/registrar-flow";
import { calculateLoggingStreak } from "@/lib/today-view-model";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";
import { sessionGoalFromMetadata } from "@/lib/session-goal";
import { getDayProgress } from "@/lib/session-goal-progress";

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
  const { supabaseEnv, user, recentSessions, rangeCloseouts, rangeCheckins, todayCheckin } =
    pageData;

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const condition = parseCondition(user.user_metadata?.condition);
  const today = getRecoveryDateKey();
  const todayProgress = getDayProgress(
    recentSessions,
    today,
    sessionGoalFromMetadata(user.user_metadata),
  );
  const requestedMode = getSingleSearchParam(resolvedSearchParams, "mode");
  const mode = resolveRegistrarMode(requestedMode, todayProgress.met, Boolean(todayCheckin));

  const sessionSuccessMessage = getSingleSearchParam(resolvedSearchParams, "sessionSummary");
  const sessionSaved = getSingleSearchParam(resolvedSearchParams, "sessionSaved") === "1";
  const savedSessionId = getSingleSearchParam(resolvedSearchParams, "sessionId");
  const sessionErrorMessage = getSingleSearchParam(resolvedSearchParams, "sessionError");
  const morningSaved = getSingleSearchParam(resolvedSearchParams, "morningSaved") === "1";
  const savedCheckinId = getSingleSearchParam(resolvedSearchParams, "checkinId");
  const morningSummary = getSingleSearchParam(resolvedSearchParams, "morningSummary");
  const showSessionSuccess = mode === "session" && sessionSaved && !sessionErrorMessage;
  const showMorningSuccess = mode === "morning" && morningSaved;
  const streak = calculateLoggingStreak(recentSessions, rangeCloseouts, new Date(), rangeCheckins);
  const savedSession = resolveSavedSession(recentSessions, savedSessionId);

  // The morning form asks about the day the patient woke up (?date=, never in the future).
  const requestedDate = getSingleSearchParam(resolvedSearchParams, "date");
  const selectedDate =
    mode === "morning" && requestedDate && !getMorningCheckinDateError(requestedDate, today)
      ? requestedDate
      : today;
  const dayBefore = addRecoveryDays(selectedDate, -1);
  // The default range covers the last 30 days; an older date needs its own small query.
  const olderDateData =
    mode === "morning" && !showMorningSuccess && selectedDate < addRecoveryDays(today, -29)
      ? await loadRecoveryPageData({ from: dayBefore, to: selectedDate, limit: null })
      : null;
  const sessionsAround = olderDateData?.rangeSessions ?? pageData.rangeSessions;
  const checkinsAround = olderDateData?.rangeCheckins ?? rangeCheckins;
  const hadSessionsDayBefore = sessionsAround.some(
    (session) => getRecoveryDateKey(session.occurredAt) === dayBefore,
  );
  const existingCheckin = checkinsAround.find((checkin) => checkin.date === selectedDate);

  const showSessionForm = mode === "session" && !showSessionSuccess;
  const { catalog, routines } = showSessionForm
    ? await loadExerciseLibrary()
    : { catalog: [], routines: [] };
  const hasSessionToday = todayProgress.count > 0;

  return (
    <>
      {showSessionSuccess || showMorningSuccess ? <ImmersiveMarker /> : null}
      {showSessionSuccess ? (
        <ToastOnMount message="Sesión guardada" onceKey={`session:${savedSessionId ?? "latest"}`} />
      ) : null}
      {showMorningSuccess ? (
        <ToastOnMount
          message="Mañana guardada"
          onceKey={`morning:${savedCheckinId ?? selectedDate}`}
        />
      ) : null}
      {showSessionSuccess ? (
        <SessionSavedState
          {...buildSessionSuccessState(todayProgress, sessionSuccessMessage)}
          dayProgress={todayProgress}
          session={savedSession}
          streak={streak}
        />
      ) : showMorningSuccess ? (
        <MorningSavedState {...buildMorningSuccessState(hasSessionToday, morningSummary)} />
      ) : (
        <div>
          {mode === "session" ? (
            <PostTherapyForm
              catalog={catalog}
              condition={condition}
              routines={routines}
              defaultOccurredAt={new Date().toISOString()}
              errorMessage={sessionErrorMessage}
              recentSessions={recentSessions}
            />
          ) : (
            <MorningCheckinForm
              condition={condition}
              existingCheckin={existingCheckin}
              hadSessionsDayBefore={hadSessionsDayBefore}
              selectedDate={selectedDate}
              today={today}
            />
          )}
        </div>
      )}
    </>
  );
}
