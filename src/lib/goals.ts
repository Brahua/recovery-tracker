import type { RecoveryGoal } from "@/types/goals";

/** Goals that are still open; the achieved ones do not count. */
export const maxPendingGoals = 10;

export const goalLimitMessage = `Ya tienes ${maxPendingGoals} metas pendientes. Marca alguna como lograda o quítala para agregar otra.`;

export interface SplitGoals {
  /** Oldest first: the order the patient wrote them. */
  pending: RecoveryGoal[];
  /** Most recently achieved first. */
  achieved: RecoveryGoal[];
}

export function splitGoals(goals: RecoveryGoal[]): SplitGoals {
  const pending = goals
    .filter((goal) => !goal.achievedAt)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const achieved = goals
    .filter((goal) => goal.achievedAt)
    .sort((left, right) => (right.achievedAt ?? "").localeCompare(left.achievedAt ?? ""));

  return { pending, achieved };
}

export function canAddGoal(pendingCount: number) {
  return pendingCount < maxPendingGoals;
}
