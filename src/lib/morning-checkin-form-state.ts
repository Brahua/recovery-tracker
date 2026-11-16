import type { PainScore, Rating1To5, ReboundLevel, StiffnessLevel } from "@/types/recovery";

// Progress of "¿Cómo amaneciste?". Sleep hours always have a value (7.5 by default); the rebound
// only counts when the day before had sessions, because only then is it asked.
export interface MorningCheckinFormValues {
  sleepQuality: Rating1To5 | null;
  wakingPain: PainScore | null;
  stiffnessLevel: StiffnessLevel | null;
  reboundPainLevel: ReboundLevel | null;
  asksRebound: boolean;
}

export function getMorningCheckinFormProgress(values: MorningCheckinFormValues) {
  const steps = [
    values.sleepQuality !== null,
    values.wakingPain !== null,
    values.stiffnessLevel !== null,
    ...(values.asksRebound ? [values.reboundPainLevel !== null] : []),
  ];
  const completedSteps = steps.filter(Boolean).length;
  return {
    completedSteps,
    totalSteps: steps.length,
    missingSteps: steps.length - completedSteps,
    isComplete: completedSteps === steps.length,
  };
}

export function formatSleepHours(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(".", ",");
}
