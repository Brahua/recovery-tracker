import { describe, expect, it } from "vitest";

import { demoProfileIds, demoProfiles } from "../../src/lib/demo/profiles.ts";
import { addDays, buildDemoDataset } from "./seed-data.mjs";

const today = "2026-10-05";

const sessionTypes = [
  "HOME",
  "PHYSIOTHERAPY",
  "HYDROTHERAPY",
  "GYM",
  "WALK",
  "OTHER",
  "MOBILITY",
  "BALANCE",
  "BREATHING",
];
const treatmentPairs = new Set([
  "PHYSICAL_AGENT:TECAR",
  "PHYSICAL_AGENT:SHOCKWAVE",
  "PHYSICAL_AGENT:LASER",
  "PHYSICAL_AGENT:ULTRASOUND",
  "PHYSICAL_AGENT:ELECTROTHERAPY",
  "PHYSICAL_AGENT:MAGNETOTHERAPY",
  "PHYSICAL_AGENT:CRYOTHERAPY",
  "PHYSICAL_AGENT:THERMOTHERAPY",
  "PHYSICAL_AGENT:PRESSOTHERAPY",
  "MANUAL_THERAPY:MASSAGE",
  "MANUAL_THERAPY:JOINT_MOBILIZATION",
  "MANUAL_THERAPY:MYOFASCIAL_RELEASE",
  "MANUAL_THERAPY:LYMPHATIC_DRAINAGE",
  "INVASIVE:DRY_NEEDLING",
  "INVASIVE:EPI",
  "INVASIVE:MESOTHERAPY",
  "INVASIVE:INFILTRATION",
  "TAPING:KINESIO_TAPE",
  "TAPING:FUNCTIONAL_TAPE",
]);
const levels = ["NONE", "MILD", "MODERATE", "STRONG"];

describe.each(demoProfileIds)("demo dataset: %s", (profileId) => {
  const data = buildDemoDataset(profileId, today);

  it("is deterministic for the same day and shifts with the day", () => {
    expect(buildDemoDataset(profileId, today)).toEqual(data);
    const shifted = buildDemoDataset(profileId, addDays(today, 1));
    expect(shifted.closeouts.at(-1).date).toBe(addDays(data.closeouts.at(-1).date, 1));
  });

  it("has enough history to exercise lists, charts and the report", () => {
    expect(data.sessions.length).toBeGreaterThanOrEqual(25);
    expect(data.closeouts.length).toBeGreaterThanOrEqual(30);
    expect(data.sessions.some((session) => session.type === "PHYSIOTHERAPY")).toBe(true);
    expect(data.goals.some((goal) => goal.achievedAt)).toBe(true);
    expect(data.goals.filter((goal) => !goal.achievedAt).length).toBeLessThanOrEqual(10);
    expect(data.routines.length).toBeGreaterThan(0);
  });

  it("never plants data in the future and leaves today open to log", () => {
    for (const session of data.sessions) expect(session.date < today).toBe(true);
    for (const closeout of data.closeouts) expect(closeout.date < today).toBe(true);
    expect(data.closeouts.some((closeout) => closeout.date === addDays(today, -1))).toBe(true);
  });

  it("respects the session constraints", () => {
    for (const session of data.sessions) {
      expect(sessionTypes).toContain(session.type);
      for (const pain of [session.painBefore, session.painAfter]) {
        expect(pain).toBeGreaterThanOrEqual(0);
        expect(pain).toBeLessThanOrEqual(10);
      }
      if (session.painDuring !== null) {
        expect(session.painDuring).toBeGreaterThanOrEqual(0);
        expect(session.painDuring).toBeLessThanOrEqual(10);
      }
      expect(session.perceivedLoad).toBeGreaterThanOrEqual(1);
      expect(session.perceivedLoad).toBeLessThanOrEqual(5);
      expect(["BETTER", "SAME", "WORSE"]).toContain(session.finalState);
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.exercises.length).toBeLessThanOrEqual(20);
      expect(new Set(session.exercises.map((exercise) => exercise.key)).size).toBe(
        session.exercises.length,
      );
      expect(session.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00-05:00$/);
      // Only physio sessions carry treatments and therapist notes.
      if (session.type !== "PHYSIOTHERAPY") {
        expect(session.treatments).toEqual([]);
        expect(session.therapistNotes).toBeUndefined();
      }
      const modalities = new Set();
      for (const treatment of session.treatments) {
        expect(treatmentPairs.has(`${treatment.category}:${treatment.modality}`)).toBe(true);
        expect(modalities.has(treatment.modality)).toBe(false);
        modalities.add(treatment.modality);
      }
    }
  });

  it("gives every exercise a valid set or a duration", () => {
    const catalogKeys = new Set(data.catalog.map((exercise) => exercise.key));
    for (const session of data.sessions) {
      for (const exercise of session.exercises) {
        expect(catalogKeys.has(exercise.key)).toBe(true);
        expect(exercise.sets.length > 0 || exercise.durationMinutes !== undefined).toBe(true);
        for (const set of exercise.sets) {
          expect(
            set.reps !== undefined || set.weightKg !== undefined || set.holdSeconds !== undefined,
          ).toBe(true);
          expect(Boolean(set.holdSeconds)).toBe(exercise.isIsometric);
        }
      }
    }
  });

  it("respects the closeout constraints, one per day", () => {
    expect(new Set(data.closeouts.map((closeout) => closeout.date)).size).toBe(
      data.closeouts.length,
    );
    for (const closeout of data.closeouts) {
      expect(closeout.endOfDayPain).toBeGreaterThanOrEqual(0);
      expect(closeout.endOfDayPain).toBeLessThanOrEqual(10);
      expect(closeout.energy).toBeGreaterThanOrEqual(1);
      expect(closeout.energy).toBeLessThanOrEqual(5);
      expect(closeout.sleepQuality).toBeGreaterThanOrEqual(1);
      expect(closeout.sleepQuality).toBeLessThanOrEqual(5);
      expect(closeout.sleepHours).toBeGreaterThanOrEqual(3);
      expect(closeout.sleepHours).toBeLessThanOrEqual(10);
      expect(levels).toContain(closeout.reboundPainLevel);
      expect(levels).toContain(closeout.stiffnessLevel);
      expect(closeout.closedTime).toMatch(/^\d{2}:\d{2}:00$/);
    }
  });

  it("shows a recovery that improves: pain drops from the first to the last week", () => {
    const average = (rows) =>
      rows.reduce((sum, row) => sum + row.endOfDayPain, 0) / Math.max(rows.length, 1);
    const first = average(data.closeouts.slice(0, 7));
    const last = average(data.closeouts.slice(-7));
    expect(last).toBeLessThan(first - 1);
  });

  it("has unique catalog names, routines and goals within the limits", () => {
    const names = data.catalog.map((exercise) => exercise.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    for (const routine of data.routines) {
      expect(routine.exercises.length).toBeLessThanOrEqual(20);
      for (const exercise of routine.exercises) {
        expect(data.catalog.some((item) => item.key === exercise.key)).toBe(true);
      }
    }
    for (const goal of data.goals) {
      expect(goal.title.length).toBeGreaterThanOrEqual(3);
      expect(goal.title.length).toBeLessThanOrEqual(80);
    }
  });
});

describe("demo profiles", () => {
  it("use distinct emails and an injury a patient can have", () => {
    const emails = demoProfileIds.map((id) => demoProfiles[id].email);
    expect(new Set(emails).size).toBe(emails.length);
    expect(demoProfiles.knee.condition).toMatchObject({
      zone: "KNEE",
      side: "LEFT",
      kind: "SURGERY",
    });
    expect(demoProfiles.ankle.condition.zone).toBe("ANKLE_FOOT");
    expect(demoProfiles.shoulder.condition.zone).toBe("SHOULDER");
  });
});
