"use server";

import { revalidatePath } from "next/cache";

import { createGoalsRepository, GoalLimitError } from "@/data/goals-repository";
import { AuthenticationRequiredError } from "@/lib/supabase/authenticated";
import { goalIdSchema, goalTitleSchema } from "@/lib/validation/goals";

export interface GoalActionResult {
  ok: boolean;
  error?: string;
}

const genericError = "No se pudo guardar. Intenta otra vez.";

function revalidateGoalViews() {
  revalidatePath("/");
  revalidatePath("/reporte");
}

function toErrorResult(error: unknown, context: string): GoalActionResult {
  if (error instanceof GoalLimitError) {
    return { ok: false, error: error.message };
  }

  if (error instanceof AuthenticationRequiredError) {
    return { ok: false, error: "Tu sesión expiró. Recarga la página e inicia sesión nuevamente." };
  }

  console.error(context, error);
  return { ok: false, error: genericError };
}

export async function addGoalAction(input: unknown): Promise<GoalActionResult> {
  const parsed = goalTitleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericError };
  }

  try {
    await (await createGoalsRepository()).createGoal(parsed.data);
  } catch (error) {
    return toErrorResult(error, "Failed to add goal.");
  }

  revalidateGoalViews();
  return { ok: true };
}

export async function achieveGoalAction(id: string): Promise<GoalActionResult> {
  if (!goalIdSchema.safeParse(id).success) return { ok: false, error: genericError };

  try {
    await (await createGoalsRepository()).markAchieved(id);
  } catch (error) {
    return toErrorResult(error, "Failed to mark goal as achieved.");
  }

  revalidateGoalViews();
  return { ok: true };
}

export async function removeGoalAction(id: string): Promise<GoalActionResult> {
  if (!goalIdSchema.safeParse(id).success) return { ok: false, error: genericError };

  try {
    await (await createGoalsRepository()).removeGoal(id);
  } catch (error) {
    return toErrorResult(error, "Failed to remove goal.");
  }

  revalidateGoalViews();
  return { ok: true };
}
