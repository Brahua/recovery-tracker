import type { PainScore, Rating1To5, ReboundLevel } from "@/types/recovery";

export interface CloseoutFormState {
  endOfDayPain: PainScore | null;
  energy: Rating1To5 | null;
  reboundPainLevel: ReboundLevel | null;
  sleepQuality: Rating1To5 | null;
}

export interface CloseoutFormProgress {
  completedSteps: number;
  isComplete: boolean;
  missingSteps: number;
  totalSteps: 4;
}

export function getCloseoutFormProgress(
  state: CloseoutFormState,
): CloseoutFormProgress {
  const completedSteps = [
    state.endOfDayPain !== null,
    state.energy !== null,
    state.reboundPainLevel !== null,
    state.sleepQuality !== null,
  ].filter(Boolean).length;
  const totalSteps = 4 as const;

  return {
    completedSteps,
    isComplete: completedSteps === totalSteps,
    missingSteps: totalSteps - completedSteps,
    totalSteps,
  };
}
