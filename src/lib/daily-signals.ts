import { addRecoveryDays } from "@/lib/recovery-date";
import type {
  MorningCheckin,
  NightlyCloseout,
  Rating1To5,
  ReboundLevel,
  StiffnessLevel,
} from "@/types/recovery";

// One day's body signals, from an older nightly closeout or a morning check-in
// (docs/specs/morning-checkin-and-daily-goal-spec.md → "Insights, Historial y Reporte"). Insights,
// the dashboard and the Reporte read this shape, so they never have to know which form a value
// came from, only what it means.
//
// | Signal  | Nightly closeout of day D   | Morning check-in of day D      |
// | pain    | end of day D                | on waking up on D              |
// | sleep   | the night recorded on D     | the night D-1 → D              |
// | rebound | to the sessions of D        | to the sessions of D-1         |
export type DailySignalSource = "closeout" | "morning";

export interface DailySignal {
  /** Day the pain, sleep and stiffness belong to ("YYYY-MM-DD"). */
  date: string;
  source: DailySignalSource;
  pain: number;
  sleepHours: number;
  sleepQuality: Rating1To5;
  /** Only older nightly closeouts asked for energy. */
  energy?: Rating1To5;
  rebound?: ReboundLevel;
  /** Day of the sessions the rebound answers to; set whenever `rebound` is. */
  reboundDate?: string;
  stiffnessLevel?: StiffnessLevel;
  notes?: string;
}

export function closeoutToSignal(closeout: NightlyCloseout): DailySignal {
  return {
    date: closeout.date,
    source: "closeout",
    pain: closeout.endOfDayPain,
    sleepHours: closeout.sleepHours,
    sleepQuality: closeout.sleepQuality,
    energy: closeout.energy,
    rebound: closeout.reboundPainLevel,
    reboundDate: closeout.date,
    stiffnessLevel: closeout.stiffnessLevel,
    notes: closeout.notes,
  };
}

export function checkinToSignal(checkin: MorningCheckin): DailySignal {
  return {
    date: checkin.date,
    source: "morning",
    pain: checkin.wakingPain,
    sleepHours: checkin.sleepHours,
    sleepQuality: checkin.sleepQuality,
    rebound: checkin.reboundPainLevel,
    reboundDate: checkin.reboundPainLevel ? addRecoveryDays(checkin.date, -1) : undefined,
    stiffnessLevel: checkin.stiffnessLevel,
    notes: checkin.notes,
  };
}

/** Every signal, newest first. A day can hold both an older closeout and a morning check-in. */
export function toDailySignals(
  closeouts: NightlyCloseout[],
  checkins: MorningCheckin[] = [],
): DailySignal[] {
  return [...closeouts.map(closeoutToSignal), ...checkins.map(checkinToSignal)].sort(
    (left, right) =>
      right.date.localeCompare(left.date) ||
      // Same day: the morning came before the night.
      (left.source === right.source ? 0 : left.source === "closeout" ? -1 : 1),
  );
}

export function hasRebound(signal: DailySignal) {
  return signal.rebound !== undefined && signal.rebound !== "NONE";
}

/** "dolor al despertar" / "dolor al final del día", for texts that name one value. */
export function signalPainLabel(source: DailySignalSource) {
  return source === "morning" ? "Dolor al despertar" : "Dolor al final del día";
}
