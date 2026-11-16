import { describe, expect, it } from "vitest";

import { demoProfileIds, demoProfiles } from "../../src/lib/demo/profiles.ts";
import { addDays, buildDemoDataset, CHECKIN_WINDOW_DAYS, weekStart } from "./seed-data.mjs";

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
    expect(shifted.checkins.at(-1).date).toBe(addDays(data.checkins.at(-1).date, 1));
  });

  it("has enough history to exercise lists, charts and the report", () => {
    expect(data.sessions.length).toBeGreaterThanOrEqual(25);
    expect(data.closeouts.length).toBeGreaterThanOrEqual(15);
    expect(data.checkins.length).toBeGreaterThanOrEqual(10);
    expect(data.closeouts.length + data.checkins.length).toBeGreaterThanOrEqual(30);
    expect(data.sessions.some((session) => session.type === "PHYSIOTHERAPY")).toBe(true);
    expect(data.goals.some((goal) => goal.achievedAt)).toBe(true);
    expect(data.goals.filter((goal) => !goal.achievedAt).length).toBeLessThanOrEqual(10);
    expect(data.routines.length).toBeGreaterThan(0);
  });

  it("never plants data in the future and leaves today open to log", () => {
    for (const session of data.sessions) expect(session.date < today).toBe(true);
    for (const closeout of data.closeouts) expect(closeout.date < today).toBe(true);
    for (const checkin of data.checkins) expect(checkin.date < today).toBe(true);
    expect(data.checkins.some((checkin) => checkin.date === addDays(today, -1))).toBe(true);
  });

  it("keeps closeouts as the legacy history, before the check-in window", () => {
    const windowStart = addDays(today, -CHECKIN_WINDOW_DAYS);
    for (const closeout of data.closeouts) expect(closeout.date < windowStart).toBe(true);
    for (const checkin of data.checkins) expect(checkin.date >= windowStart).toBe(true);
    const closeoutDates = new Set(data.closeouts.map((closeout) => closeout.date));
    for (const checkin of data.checkins) expect(closeoutDates.has(checkin.date)).toBe(false);
  });

  it("respects the morning check-in constraints, one per day", () => {
    expect(new Set(data.checkins.map((checkin) => checkin.date)).size).toBe(data.checkins.length);
    for (const checkin of data.checkins) {
      expect(checkin.sleepHours).toBeGreaterThanOrEqual(0);
      expect(checkin.sleepHours).toBeLessThanOrEqual(24);
      expect(Number.isInteger(checkin.sleepHours * 2)).toBe(true);
      expect(Number.isInteger(checkin.sleepQuality)).toBe(true);
      expect(checkin.sleepQuality).toBeGreaterThanOrEqual(1);
      expect(checkin.sleepQuality).toBeLessThanOrEqual(5);
      expect(Number.isInteger(checkin.wakingPain)).toBe(true);
      expect(checkin.wakingPain).toBeGreaterThanOrEqual(0);
      expect(checkin.wakingPain).toBeLessThanOrEqual(10);
      expect(levels).toContain(checkin.stiffnessLevel);
      if (checkin.notes !== undefined) expect(checkin.notes.length).toBeGreaterThan(0);
    }
  });

  it("asks for the rebound only when the day before had a session", () => {
    const sessionDates = new Set(data.sessions.map((session) => session.date));
    for (const checkin of data.checkins) {
      if (sessionDates.has(addDays(checkin.date, -1))) {
        expect(levels).toContain(checkin.reboundPainLevel);
      } else {
        expect(checkin.reboundPainLevel).toBeNull();
      }
    }
    expect(data.checkins.some((checkin) => checkin.reboundPainLevel !== null)).toBe(true);
  });

  it("has a session goal that some recent weeks meet and others miss", () => {
    const { perDay, daysPerWeek } = data.sessionGoal;
    expect(Number.isInteger(perDay) && perDay >= 1 && perDay <= 5).toBe(true);
    expect(Number.isInteger(daysPerWeek) && daysPerWeek >= 1 && daysPerWeek <= 7).toBe(true);

    const perDate = new Map();
    for (const session of data.sessions) {
      perDate.set(session.date, (perDate.get(session.date) ?? 0) + 1);
    }
    // Whole Monday-to-Sunday weeks inside the data, the current one left out.
    const outcomes = [];
    for (
      let monday = addDays(weekStart(today), -7);
      monday >= data.sessions[0].date;
      monday = addDays(monday, -7)
    ) {
      let doneDays = 0;
      for (let offset = 0; offset < 7; offset += 1) {
        if ((perDate.get(addDays(monday, offset)) ?? 0) >= perDay) doneDays += 1;
      }
      outcomes.push(doneDays >= daysPerWeek);
    }
    expect(outcomes).toContain(true);
    expect(outcomes).toContain(false);
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
    const average = (values) =>
      values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const first = average(data.closeouts.slice(0, 7).map((closeout) => closeout.endOfDayPain));
    const last = average(data.checkins.slice(-7).map((checkin) => checkin.wakingPain));
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

  it("each have their own session goal", () => {
    expect(buildDemoDataset("knee", today).sessionGoal).toEqual({ perDay: 1, daysPerWeek: 5 });
    expect(buildDemoDataset("ankle", today).sessionGoal).toEqual({ perDay: 2, daysPerWeek: 5 });
    expect(buildDemoDataset("shoulder", today).sessionGoal).toEqual({ perDay: 1, daysPerWeek: 3 });
  });
});
