import type { FinalState, PainScore } from "@/types/recovery";

export interface SessionFormState {
  painBefore: PainScore | null;
  painDuring: PainScore | null;
  painAfter: PainScore | null;
  finalState: FinalState | null;
  exerciseCount: number;
}

export interface SessionFormProgress {
  completedSteps: number;
  isComplete: boolean;
  missingSteps: number;
  totalSteps: 5;
}

export function getSessionFormProgress(state: SessionFormState): SessionFormProgress {
  const completedSteps = [
    state.painBefore !== null,
    state.painDuring !== null,
    state.painAfter !== null,
    state.finalState !== null,
    state.exerciseCount > 0,
  ].filter(Boolean).length;
  const totalSteps = 5 as const;

  return {
    completedSteps,
    isComplete: completedSteps === totalSteps,
    missingSteps: totalSteps - completedSteps,
    totalSteps,
  };
}
