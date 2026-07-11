export const painScores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const rating1To5Values = [1, 2, 3, 4, 5] as const;

export const sessionTypes = [
  "HOME",
  "PHYSIOTHERAPY",
  "HYDROTHERAPY",
  "GYM",
  "WALK",
  "OTHER",
] as const;

export const finalStates = ["BETTER", "SAME", "WORSE"] as const;

export const reboundLevels = ["NONE", "MILD", "MODERATE", "STRONG"] as const;

export const exerciseShortcutIds = [
  "BICICLETA",
  "SENTADILLA_ESPANOLA",
  "TKE",
  "STEP_UP",
  "STEP_DOWN",
  "HIP_THRUST",
  "PESO_MUERTO_RUMANO",
  "CAMINATA_LATERAL_BANDA",
  "PROPIOCEPCION",
  "ESTIRAMIENTOS_SUAVES",
] as const;

export type PainScore = (typeof painScores)[number];
export type Rating1To5 = (typeof rating1To5Values)[number];
export type SessionType = (typeof sessionTypes)[number];
export type FinalState = (typeof finalStates)[number];
export type ReboundLevel = (typeof reboundLevels)[number];
export type ExerciseShortcutId = (typeof exerciseShortcutIds)[number];

export type ISODateString = string;
export type ISODateTimeString = string;

export interface SessionExercise {
  name: string;
  shortcutId?: ExerciseShortcutId;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
}

export interface RehabSession {
  id: string;
  occurredAt: ISODateTimeString;
  sessionType: SessionType;
  painBefore: PainScore;
  painDuring?: PainScore;
  painAfter: PainScore;
  perceivedLoad: Rating1To5;
  exercises: SessionExercise[];
  finalState: FinalState;
  notes?: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface NightlyCloseout {
  id: string;
  date: ISODateString;
  endOfDayPain: PainScore;
  energy: Rating1To5;
  sleepHours: number;
  sleepQuality: Rating1To5;
  reboundPainLevel: ReboundLevel;
  notes?: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface DateRangeParams {
  from: ISODateString;
  to: ISODateString;
}

export type CreateRehabSessionInput = Omit<
  RehabSession,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateRehabSessionInput = Partial<CreateRehabSessionInput>;

export type CreateNightlyCloseoutInput = Omit<
  NightlyCloseout,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateNightlyCloseoutInput = Partial<CreateNightlyCloseoutInput>;
