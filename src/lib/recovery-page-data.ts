import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

interface RecoveryPageDataOptions {
  from?: string;
  to?: string;
  limit?: number | null;
}

function getRecentDateRange(fromOverride?: string, toOverride?: string) {
  const today = getRecoveryDateKey();

  return {
    from: fromOverride ?? addRecoveryDays(today, -30),
    to: toOverride ?? today,
  };
}

function todayKey() {
  return getRecoveryDateKey();
}

export async function loadRecoveryPageData(options: RecoveryPageDataOptions = {}) {
  const supabaseEnv = getSupabaseEnv();
  const supabase = supabaseEnv ? await createServerSupabaseClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const repository = user ? await createRecoveryLogRepository() : null;
  const recentRange = getRecentDateRange(options.from, options.to);
  const sessionRecords = repository ? await repository.listRehabSessions(recentRange) : [];
  const [closeoutRecords, checkinRecords] = repository
    ? await Promise.all([
        repository.listNightlyCloseouts(recentRange),
        repository.listMorningCheckins(recentRange),
      ])
    : [[], []];
  const limit = options.limit === undefined ? 4 : options.limit;
  const recentSessions = limit === null ? sessionRecords : sessionRecords.slice(0, limit);
  const recentCloseouts = limit === null ? closeoutRecords : closeoutRecords.slice(0, limit);
  const today = todayKey();
  const hasSessionToday = recentSessions.some(
    (session) => getRecoveryDateKey(session.occurredAt) === today,
  );
  const hasCloseoutToday = recentCloseouts.some((closeout) => closeout.date === today);
  const todayCheckin = checkinRecords.find((checkin) => checkin.date === today);

  return {
    supabaseEnv,
    user,
    /** Every session and closeout of the range (default: the last 30 days), without the limit. */
    rangeSessions: sessionRecords,
    rangeCloseouts: closeoutRecords,
    /** Morning check-ins of the range, newest first (never limited: one per day). */
    rangeCheckins: checkinRecords,
    todayCheckin,
    recentSessions,
    recentCloseouts,
    hasSessionToday,
    hasCloseoutToday,
  };
}
