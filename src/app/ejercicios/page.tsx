import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ExerciseCatalog, type CatalogSection } from "@/features/exercises/exercise-catalog";
import { loadExerciseLibrary } from "@/lib/exercise-library";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";
import { calculateLoggingStreak } from "@/lib/today-view-model";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { seccion } = await searchParams;
  const section: CatalogSection = seccion === "rutinas" ? "rutinas" : "ejercicios";
  const { supabaseEnv, user, recentSessions, recentCloseouts } =
    await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const { catalog: exercises, routines } = await loadExerciseLibrary();

  return (
    <AppShell
      pathname="/ejercicios"
      streak={calculateLoggingStreak(recentSessions, recentCloseouts)}
      user={user}
    >
      <ExerciseCatalog exercises={exercises} routines={routines} section={section} />
    </AppShell>
  );
}
