import { redirect } from "next/navigation";

import { loadExerciseLibrary } from "@/lib/exercise-library";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

export async function loadRoutinePageData() {
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const { catalog } = await loadExerciseLibrary({ includeRoutines: false });

  return {
    user,
    streak: calculateLoggingStreak(recentSessions, recentCloseouts),
    catalog,
  };
}
