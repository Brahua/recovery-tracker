import type { FinalState, PainScore } from "@/types/recovery";

export interface SessionFormState {
  painBefore: PainScore | null;
  painDuring: PainScore | null;
  painAfter: PainScore | null;
  finalState: FinalState | null;
  exerciseCount: number;
  selectedExerciseCount: number;
  /** Only physio sessions record treatments; other types leave these out. */
  treatmentCount?: number;
  selectedTreatmentCount?: number;
}

export interface SessionFormProgress {
  completedSteps: number;
  isComplete: boolean;
  missingSteps: number;
  totalSteps: 5;
}

export function getSessionFormProgress(state: SessionFormState): SessionFormProgress {
  const treatmentCount = state.treatmentCount ?? 0;
  const selectedTreatmentCount = state.selectedTreatmentCount ?? 0;
  // Step 5: at least one exercise or treatment, and nothing selected left incomplete.
  const exercisesComplete =
    state.exerciseCount + treatmentCount > 0 &&
    state.exerciseCount === state.selectedExerciseCount &&
    treatmentCount === selectedTreatmentCount;
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
