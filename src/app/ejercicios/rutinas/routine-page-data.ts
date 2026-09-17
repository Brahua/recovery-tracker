import { redirect } from "next/navigation";

import { createExerciseRepository } from "@/data/exercise-repository";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

export async function loadRoutinePageData() {
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const exerciseRepository = await createExerciseRepository();
  await exerciseRepository.ensureDefaultExercises();

  return {
    user,
    streak: calculateLoggingStreak(recentSessions, recentCloseouts),
    catalog: await exerciseRepository.listExercises(),
  };
}
