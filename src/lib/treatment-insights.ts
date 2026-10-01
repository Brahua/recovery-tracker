import { getRecoveryDateKey } from "@/lib/recovery-date";
import { treatmentLabel } from "@/lib/treatments";
import type { NightlyCloseout, RehabSession, SessionTreatment } from "@/types/recovery";

/** Sessions needed with a treatment before comparing it against physio sessions without it. */
export const minTreatmentSessionsForComparison = 3;

export interface TreatmentFrequencyItem {
  key: string;
  label: string;
  count: number;
  zones: string[];
}

export interface TreatmentResponseItem {
  key: string;
  label: string;
  sessionCount: number;
  hasEnoughData: boolean;
  /** Average pain change (after − before) in physio sessions with the treatment. */
  painDeltaWith?: number;
  /** Same, in physio sessions without it. */
  painDeltaWithout?: number;
  /** Share (0–100) of sessions with a closeout that day reporting rebound. */
  reboundRateWith?: number;
  reboundRateWithout?: number;
}

export function treatmentKey(treatment: Pick<SessionTreatment, "modality" | "customName">) {
  return treatment.modality === "OTHER"
    ? `OTHER:${(treatment.customName ?? "").trim().toLocaleLowerCase("es")}`
    : treatment.modality;
}

function average(values: number[]) {
  if (values.length === 0) return undefined;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

function percentage(part: number, total: number) {
  return total === 0 ? undefined : Math.round((part / total) * 100);
}

function physioSessionsWithTreatments(sessions: RehabSession[]) {
  return sessions.filter(
    (session) => session.sessionType === "PHYSIOTHERAPY" && session.treatments.length > 0,
  );
}

/** How often each treatment was applied, most frequent first, with the zones recorded. */
export function calculateTreatmentFrequency(sessions: RehabSession[]): TreatmentFrequencyItem[] {
  const items = new Map<string, { label: string; count: number; zones: Map<string, string> }>();

  for (const session of physioSessionsWithTreatments(sessions)) {
    for (const treatment of session.treatments) {
      const key = treatmentKey(treatment);
      const item = items.get(key) ?? { label: treatmentLabel(treatment), count: 0, zones: new Map() };
      item.count += 1;

      const zone = treatment.bodyZone?.trim();
      if (zone) {
        const zoneKey = zone.toLocaleLowerCase("es");
        if (!item.zones.has(zoneKey)) item.zones.set(zoneKey, zone);
      }

      items.set(key, item);
    }
  }

  return [...items.entries()]
    .map(([key, item]) => ({ key, label: item.label, count: item.count, zones: [...item.zones.values()] }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "es"));
}

/**
 * Compares each treatment against the other physio sessions: pain change during
 * the session and rebound reported in that day's closeout.
 */
export function calculateTreatmentResponse(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
): TreatmentResponseItem[] {
  const physioSessions = sessions.filter((session) => session.sessionType === "PHYSIOTHERAPY");
  const reboundByDate = new Map(
    closeouts.map((closeout) => [closeout.date, closeout.reboundPainLevel !== "NONE"]),
  );

  function summarize(group: RehabSession[]) {
    const reboundFlags = group.flatMap((session) => {
      const rebound = reboundByDate.get(getRecoveryDateKey(session.occurredAt));
      return rebound === undefined ? [] : [rebound];
    });

    return {
      painDelta: average(group.map((session) => session.painAfter - session.painBefore)),
      reboundRate: percentage(reboundFlags.filter(Boolean).length, reboundFlags.length),
    };
  }

  return calculateTreatmentFrequency(physioSessions).map((item) => {
    const withTreatment = physioSessions.filter((session) =>
      session.treatments.some((treatment) => treatmentKey(treatment) === item.key),
    );
    const withoutTreatment = physioSessions.filter((session) => !withTreatment.includes(session));
    const hasEnoughData = withTreatment.length >= minTreatmentSessionsForComparison;
    const withSummary = summarize(withTreatment);
    const withoutSummary = summarize(withoutTreatment);

    return {
      key: item.key,
      label: item.label,
      sessionCount: withTreatment.length,
      hasEnoughData,
      painDeltaWith: hasEnoughData ? withSummary.painDelta : undefined,
      painDeltaWithout: hasEnoughData ? withoutSummary.painDelta : undefined,
      reboundRateWith: hasEnoughData ? withSummary.reboundRate : undefined,
      reboundRateWithout: hasEnoughData ? withoutSummary.reboundRate : undefined,
    };
  });
}
