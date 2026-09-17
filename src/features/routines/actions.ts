"use server";

import { revalidatePath } from "next/cache";

import {
  createRoutineRepository,
  DuplicateRoutineNameError,
} from "@/data/routine-repository";
import { routineIdSchema, routineInputSchema, routineNameSchema } from "@/lib/validation/routines";

export interface RoutineActionResult {
  ok: boolean;
  error?: string;
  routineId?: string;
}

const genericError = "No se pudo guardar la rutina. Intenta otra vez.";

function revalidateRoutineViews() {
  revalidatePath("/ejercicios");
  revalidatePath("/registrar");
}

function toErrorResult(error: unknown, context: string): RoutineActionResult {
  if (error instanceof DuplicateRoutineNameError) {
    return { ok: false, error: error.message };
  }

  if (error instanceof Error && error.message === "Authenticated user is required.") {
    return { ok: false, error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente." };
  }

  console.error(context, error);
  return { ok: false, error: genericError };
}

export async function saveRoutineAction(
  id: string | null,
  input: unknown,
): Promise<RoutineActionResult> {
  const parsed = routineInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericError };
  }

  if (id !== null && !routineIdSchema.safeParse(id).success) {
    return { ok: false, error: genericError };
  }

  try {
    const repository = await createRoutineRepository();
    const routineId = await repository.saveRoutine(id, parsed.data);
    revalidateRoutineViews();
    // A new name typed in a routine can create catalog exercises.
    revalidatePath("/ejercicios/rutinas/[id]", "page");
    return { ok: true, routineId };
  } catch (error) {
    return toErrorResult(error, "Failed to save routine.");
  }
}

export async function deleteRoutineAction(id: string): Promise<RoutineActionResult> {
  if (!routineIdSchema.safeParse(id).success) {
    return { ok: false, error: genericError };
  }

  try {
    const repository = await createRoutineRepository();
    await repository.deleteRoutine(id);
  } catch (error) {
    return toErrorResult(error, "Failed to delete routine.");
  }

  revalidateRoutineViews();
  return { ok: true };
}

export async function createRoutineFromSessionAction(
  sessionId: string,
  name: string,
): Promise<RoutineActionResult> {
  const parsedName = routineNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { ok: false, error: parsedName.error.issues[0]?.message ?? genericError };
  }

  if (!routineIdSchema.safeParse(sessionId).success) {
    return { ok: false, error: genericError };
  }

  try {
    const repository = await createRoutineRepository();
    const routineId = await repository.createRoutineFromSession(sessionId, parsedName.data);
    revalidateRoutineViews();
    return { ok: true, routineId };
  } catch (error) {
    return toErrorResult(error, "Failed to create routine from session.");
  }
}
