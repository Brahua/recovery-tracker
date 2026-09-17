import { createExerciseRepository } from "@/data/exercise-repository";
import { createRoutineRepository } from "@/data/routine-repository";

// Catalog (seeded on first use) and, optionally, routines for pages that edit or log exercises.
export async function loadExerciseLibrary({ includeRoutines = true } = {}) {
  const exerciseRepository = await createExerciseRepository();
  // Seed before the single list call: repeating the same GET within one server
  // render returns React's memoized (empty) response instead of the new rows.
  await exerciseRepository.ensureDefaultExercises();
  const catalog = await exerciseRepository.listExercises();

  if (!includeRoutines) {
    return { catalog, routines: [] };
  }

  const routineRepository = await createRoutineRepository();
  const routines = await routineRepository.listRoutines(
    new Map(catalog.map((exercise) => [exercise.id, exercise.name])),
  );

  return { catalog, routines };
}
