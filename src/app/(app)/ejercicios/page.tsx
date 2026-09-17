import { redirect } from "next/navigation";

import { ExerciseCatalog, type CatalogSection } from "@/features/exercises/exercise-catalog";
import { loadExerciseLibrary } from "@/lib/exercise-library";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { seccion } = await searchParams;
  const section: CatalogSection = seccion === "rutinas" ? "rutinas" : "ejercicios";
  const { supabaseEnv, user } = await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const { catalog: exercises, routines } = await loadExerciseLibrary();

  return (
    <ExerciseCatalog exercises={exercises} routines={routines} section={section} />
  );
}
