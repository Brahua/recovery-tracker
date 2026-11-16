import { describe, expect, it } from "vitest";

import { checkinToSignal, closeoutToSignal, hasRebound, toDailySignals } from "@/lib/daily-signals";
import { buildReboundDistribution } from "@/lib/insights-view-model";
import { calculateReboundSummary, calculateSleepPainComparison } from "@/lib/recovery-calculations";
import { buildReboundAssociationReport } from "@/lib/recovery-insights";
import { calculateTreatmentResponse } from "@/lib/treatment-insights";
import type { MorningCheckin, NightlyCloseout, RehabSession } from "@/types/recovery";

const checkin = (date: string, overrides: Partial<MorningCheckin> = {}): MorningCheckin => ({
  id: `checkin-${date}`,
  date,
  sleepHours: 7.5,
  sleepQuality: 4,
  wakingPain: 2,
  stiffnessLevel: "MILD",
  createdAt: `${date}T12:00:00.000Z`,
  updatedAt: `${date}T12:00:00.000Z`,
  ...overrides,
});

const closeout = (date: string, overrides: Partial<NightlyCloseout> = {}): NightlyCloseout => ({
  id: `closeout-${date}`,
  date,
  endOfDayPain: 4,
  energy: 3,
  sleepHours: 6,
  sleepQuality: 3,
  reboundPainLevel: "NONE",
  createdAt: `${date}T03:00:00.000Z`,
  updatedAt: `${date}T03:00:00.000Z`,
  ...overrides,
});

const session = (date: string, overrides: Partial<RehabSession> = {}): RehabSession => ({
  id: `session-${date}`,
  occurredAt: `${date}T15:00:00.000Z`,
  sessionType: "HOME",
  painBefore: 3,
  painAfter: 2,
  perceivedLoad: 3,
  exercises: [{ name: "Step-up", sets: [] }],
  finalState: "BETTER",
  treatments: [],
  createdAt: `${date}T15:00:00.000Z`,
  updatedAt: `${date}T15:00:00.000Z`,
  ...overrides,
});

describe("daily signals", () => {
  it("ties a morning rebound to the sessions of the day before", () => {
    // Waking up on Nov 1 answers about the sessions of Oct 31 (month change).
    expect(checkinToSignal(checkin("2026-11-01", { reboundPainLevel: "MILD" }))).toMatchObject({
      date: "2026-11-01",
      source: "morning",
      pain: 2,
      rebound: "MILD",
      reboundDate: "2026-10-31",
    });
  });

  it("has no rebound after a day without sessions", () => {
    const signal = checkinToSignal(checkin("2026-11-17"));
    expect(signal.rebound).toBeUndefined();
    expect(signal.reboundDate).toBeUndefined();
    expect(hasRebound(signal)).toBe(false);
  });

  it("keeps an older closeout's rebound on its own day, with its energy", () => {
    expect(closeoutToSignal(closeout("2026-10-20", { reboundPainLevel: "STRONG" }))).toMatchObject({
      source: "closeout",
      pain: 4,
      energy: 3,
      rebound: "STRONG",
      reboundDate: "2026-10-20",
    });
  });

  it("merges both sources newest first, the morning before the night on the same day", () => {
    const signals = toDailySignals(
      [closeout("2026-10-01"), closeout("2026-10-03")],
      [checkin("2026-10-03"), checkin("2026-10-02")],
    );
    expect(signals.map((signal) => `${signal.date}:${signal.source}`)).toEqual([
      "2026-10-03:closeout",
      "2026-10-03:morning",
      "2026-10-02:morning",
      "2026-10-01:closeout",
    ]);
  });
});

describe("calculations over mixed signals", () => {
  const sessions = [session("2026-11-16")];
  const signals = toDailySignals(
    [closeout("2026-11-01", { reboundPainLevel: "MODERATE" })], // outside the 7-day windows
    [
      checkin("2026-11-17", { reboundPainLevel: "STRONG" }), // answers to Nov 16
      checkin("2026-11-15"), // rest day before: no rebound question
    ],
  );

  it("counts the morning rebound in the window of the session it answers to", () => {
    // The 7-day window ending Nov 16 holds the Nov 16 session; the rebound came on Nov 17.
    const summary = calculateReboundSummary(sessions, signals, 7, "2026-11-16T20:00:00.000Z");
    expect(summary).toMatchObject({
      sessionCount: 1,
      closeoutCount: 1,
      reboundCount: 1,
      strongReboundCount: 1,
      latestReboundLevel: "STRONG",
    });
  });

  it("associates exercises with the session of the day before a morning rebound", () => {
    const text = buildReboundAssociationReport(sessions, signals, 7, "2026-11-17T20:00:00.000Z");
    expect(text).toContain("Las sesiones que coincidieron con rebote fueron 1");
    expect(text).toContain("Step-up");
  });

  it("leaves mornings without a rebound question out of the distribution", () => {
    const distribution = buildReboundDistribution(signals);
    expect(distribution.reduce((total, item) => total + item.count, 0)).toBe(2);
  });

  it("pairs each night with the pain that followed it", () => {
    const summary = calculateSleepPainComparison(
      toDailySignals(
        [],
        [
          checkin("2026-11-14", { sleepHours: 5, wakingPain: 6 }),
          checkin("2026-11-15", { sleepHours: 5.5, wakingPain: 5 }),
          checkin("2026-11-16", { sleepHours: 8, wakingPain: 2 }),
          checkin("2026-11-17", { sleepHours: 7, wakingPain: 3 }),
        ],
      ),
      14,
      "2026-11-17T20:00:00.000Z",
    );
    expect(summary).toMatchObject({
      relationship: "HIGHER_AFTER_LOW_SLEEP",
      lowSleepPainAverage: 5.5,
      adequateSleepPainAverage: 2.5,
    });
  });

  it("matches a physio session with the next morning's rebound", () => {
    // Three physio sessions with laser (rebound the next morning) and three without (none).
    const dates = [
      "2026-11-02",
      "2026-11-04",
      "2026-11-06",
      "2026-11-08",
      "2026-11-10",
      "2026-11-12",
    ];
    const sessionsWithLaser = new Set(dates.slice(0, 3));
    const physioSessions = dates.map((date) =>
      session(date, {
        id: `physio-${date}`,
        sessionType: "PHYSIOTHERAPY",
        treatments: sessionsWithLaser.has(date)
          ? [{ category: "PHYSICAL_AGENT", modality: "LASER" }]
          : [{ category: "PHYSICAL_AGENT", modality: "TECAR" }],
      }),
    );
    const mornings = dates.map((date) =>
      checkin(
        new Date(Date.parse(`${date}T12:00:00.000Z`) + 86_400_000).toISOString().slice(0, 10),
        { reboundPainLevel: sessionsWithLaser.has(date) ? "MILD" : "NONE" },
      ),
    );

    const laser = calculateTreatmentResponse(physioSessions, toDailySignals([], mornings)).find(
      (item) => item.label === "Láser",
    );
    expect(laser).toMatchObject({ sessionCount: 3, reboundRateWith: 100, reboundRateWithout: 0 });
  });
});
