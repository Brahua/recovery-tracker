import { redirect } from "next/navigation";

import { loadExerciseLibrary } from "@/lib/exercise-library";
import { loadRecoveryPageData } from "@/lib/recovery-page-data";

export async function loadRoutinePageData() {
  const { supabaseEnv, user } = await loadRecoveryPageData({ limit: null });

  if (!supabaseEnv || !user) {
    redirect("/");
  }

  const { catalog } = await loadExerciseLibrary({ includeRoutines: false });

  return { catalog };
}
