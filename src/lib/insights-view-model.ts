import type { NightlyCloseout, RehabSession } from "@/types/recovery";

export interface WeeklySessionCount {
  label: string;
  count: number;
}

export interface ReboundDistributionItem {
  label: string;
  count: number;
  percentage: number;
  tone: "none" | "mild" | "strong";
}

function toUtcDay(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function buildFourWeekSessionCounts(
  sessions: RehabSession[],
  referenceDate: string | Date = new Date(),
): WeeklySessionCount[] {
  const dayInMs = 86_400_000;
  const end = toUtcDay(referenceDate);
  const start = end - 27 * dayInMs;
  const buckets = [0, 0, 0, 0];

  for (const session of sessions) {
    const occurredAt = toUtcDay(session.occurredAt);
    if (occurredAt < start || occurredAt > end) continue;

    const bucket = Math.min(3, Math.floor((occurredAt - start) / (7 * dayInMs)));
    buckets[bucket] += 1;
  }

  return buckets.map((count, index) => ({ label: `S${index + 1}`, count }));
}

export function buildReboundDistribution(
  closeouts: NightlyCloseout[],
): ReboundDistributionItem[] {
  const counts = {
    none: closeouts.filter((item) => item.reboundPainLevel === "NONE").length,
    mild: closeouts.filter((item) => item.reboundPainLevel === "MILD").length,
    strong: closeouts.filter(
      (item) =>
        item.reboundPainLevel === "MODERATE" ||
        item.reboundPainLevel === "STRONG",
    ).length,
  };
  const percentage = (count: number) =>
    closeouts.length === 0 ? 0 : Math.round((count / closeouts.length) * 100);

  return [
    {
      label: "Sin rebote",
      count: counts.none,
      percentage: percentage(counts.none),
      tone: "none",
    },
    {
      label: "Un poco",
      count: counts.mild,
      percentage: percentage(counts.mild),
      tone: "mild",
    },
    {
      label: "Si",
      count: counts.strong,
      percentage: percentage(counts.strong),
      tone: "strong",
    },
  ];
}
