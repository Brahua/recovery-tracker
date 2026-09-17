import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createExerciseRepository } from "@/data/exercise-repository";
import { ExerciseCatalog } from "@/features/exercises/exercise-catalog";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

export default async function EjerciciosPage() {
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const repository = await createExerciseRepository();
  await repository.ensureDefaultExercises();
  const exercises = await repository.listExercises();

  return (
    <AppShell
      pathname="/ejercicios"
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={user}
    >
      <ExerciseCatalog exercises={exercises} />
    </AppShell>
  );
}
