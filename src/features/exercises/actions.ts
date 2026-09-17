"use server";

import { revalidatePath } from "next/cache";

import {
  createExerciseRepository,
  DuplicateExerciseNameError,
} from "@/data/exercise-repository";
import { exerciseIdSchema, exerciseInputSchema } from "@/lib/validation/exercises";

export interface ExerciseActionResult {
  ok: boolean;
  error?: string;
}

const genericError = "No se pudo guardar. Intenta otra vez.";

function revalidateExerciseViews() {
  revalidatePath("/ejercicios");
  revalidatePath("/registrar");
}

function toErrorResult(error: unknown, context: string): ExerciseActionResult {
  if (error instanceof DuplicateExerciseNameError) {
    return { ok: false, error: error.message };
  }

  if (error instanceof Error && error.message === "Authenticated user is required.") {
    return { ok: false, error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente." };
  }

  console.error(context, error);
  return { ok: false, error: genericError };
}

export async function saveExerciseAction(
  id: string | null,
  input: unknown,
): Promise<ExerciseActionResult> {
  const parsed = exerciseInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericError };
  }

  if (id !== null && !exerciseIdSchema.safeParse(id).success) {
    return { ok: false, error: genericError };
  }

  try {
    const repository = await createExerciseRepository();
    if (id === null) {
      await repository.createExercise(parsed.data);
    } else {
      await repository.updateExercise(id, parsed.data);
    }
  } catch (error) {
    return toErrorResult(error, "Failed to save exercise.");
  }

  revalidateExerciseViews();
  return { ok: true };
}

export async function setExerciseArchivedAction(
  id: string,
  archived: boolean,
): Promise<ExerciseActionResult> {
  if (!exerciseIdSchema.safeParse(id).success) {
    return { ok: false, error: genericError };
  }

  try {
    const repository = await createExerciseRepository();
    await repository.setExerciseArchived(id, archived);
  } catch (error) {
    return toErrorResult(error, "Failed to archive exercise.");
  }

  revalidateExerciseViews();
  return { ok: true };
}

export async function mergeExercisesAction(
  sourceId: string,
  targetId: string,
): Promise<ExerciseActionResult> {
  if (
    sourceId === targetId ||
    !exerciseIdSchema.safeParse(sourceId).success ||
    !exerciseIdSchema.safeParse(targetId).success
  ) {
    return { ok: false, error: "Elige otro ejercicio para fusionar." };
  }

  try {
    const repository = await createExerciseRepository();
    await repository.mergeExercises(sourceId, targetId);
  } catch (error) {
    return toErrorResult(error, "Failed to merge exercises.");
  }

  revalidateExerciseViews();
  revalidatePath("/");
  revalidatePath("/insights");
  revalidatePath("/reporte");
  return { ok: true };
}
