import type { FinalState, PainScore } from "@/types/recovery";

export interface SessionFormState {
  painBefore: PainScore | null;
  painDuring: PainScore | null;
  painAfter: PainScore | null;
  finalState: FinalState | null;
  exerciseCount: number;
  selectedExerciseCount: number;
}

export interface SessionFormProgress {
  completedSteps: number;
  isComplete: boolean;
  missingSteps: number;
  totalSteps: 5;
}

export function getSessionFormProgress(state: SessionFormState): SessionFormProgress {
  const exercisesComplete =
    state.selectedExerciseCount > 0 &&
    state.exerciseCount === state.selectedExerciseCount;
  const completedSteps = [
    state.painBefore !== null,
    state.painDuring !== null,
    state.painAfter !== null,
    state.finalState !== null,
    exercisesComplete,
  ].filter(Boolean).length;
  const totalSteps = 5 as const;

  return {
    completedSteps,
    isComplete: completedSteps === totalSteps,
    missingSteps: totalSteps - completedSteps,
    totalSteps,
  };
}
