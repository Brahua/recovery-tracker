import { goalLimitMessage } from "@/lib/goals";
import { requireAuthenticatedSupabase } from "@/lib/supabase/authenticated";
import type { RecoveryGoal } from "@/types/goals";

export class GoalsRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoalsRepositoryError";
  }
}

export class GoalLimitError extends GoalsRepositoryError {
  constructor() {
    super(goalLimitMessage);
    this.name = "GoalLimitError";
  }
}

export interface GoalsRepository {
  listGoals(): Promise<RecoveryGoal[]>;
  createGoal(title: string): Promise<void>;
  markAchieved(id: string): Promise<void>;
  removeGoal(id: string): Promise<void>;
}

interface GoalRow {
  id: string;
  title: string;
  achieved_at: string | null;
  created_at: string;
}

const goalColumns = "id, title, achieved_at, created_at";

export function mapGoalRow(row: GoalRow): RecoveryGoal {
  return {
    id: row.id,
    title: row.title,
    achievedAt: row.achieved_at ?? undefined,
    createdAt: row.created_at,
  };
}

// The signed-in user's goals. RLS limits every query to the owner.
export async function createGoalsRepository(): Promise<GoalsRepository> {
  const { supabase, userId } = await requireAuthenticatedSupabase();

  return {
    async listGoals() {
      const { data, error } = await supabase
        .from("recovery_goals")
        .select(goalColumns)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .returns<GoalRow[]>();
      if (error) throw new GoalsRepositoryError(error.message);
      return (data ?? []).map(mapGoalRow);
    },

    async createGoal(title) {
      const { error } = await supabase.from("recovery_goals").insert({ user_id: userId, title });
      if (error) {
        if (error.message.includes("recovery_goals_limit")) throw new GoalLimitError();
        throw new GoalsRepositoryError(error.message);
      }
    },

    async markAchieved(id) {
      const { error } = await supabase
        .from("recovery_goals")
        .update({ achieved_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .is("achieved_at", null);
      if (error) throw new GoalsRepositoryError(error.message);
    },

    async removeGoal(id) {
      const { error } = await supabase
        .from("recovery_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new GoalsRepositoryError(error.message);
    },
  };
}
