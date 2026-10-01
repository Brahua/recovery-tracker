import { describe, expect, it } from "vitest";

import { toExercisePayload } from "@/lib/exercise-entry-state";
import { sessionToExerciseEntries, sessionToTreatmentDrafts } from "@/lib/session-edit-state";
import { toTreatmentPayload } from "@/lib/treatments";
import type { RehabSession } from "@/types/recovery";

function counterIds() {
  let next = 0;
  return (prefix: string) => `${prefix}-${next++}`;
}

const session: RehabSession = {
  id: "session-1",
  occurredAt: "2026-09-29T23:30:00.000Z",
  sessionType: "PHYSIOTHERAPY",
  painBefore: 3,
  painDuring: 4,
  painAfter: 2,
  perceivedLoad: 3,
  finalState: "BETTER",
  exercises: [
    {
      name: "Step-up viejo",
      exerciseId: "exercise-1",
      isIsometric: false,
      sets: [
        { position: 0, reps: 10, weightKg: 7.5, notes: "lento" },
        { position: 1, reps: 8 },
      ],
      notes: "rodilla estable",
    },
    {
      name: "Wall sit",
      exerciseId: "exercise-2",
      isIsometric: true,
      sets: [{ position: 0, holdSeconds: 45 }],
    },
    { name: "Bicicleta", exerciseId: "exercise-3", durationMinutes: 12.5, distanceKm: 4.2, sets: [] },
  ],
  treatments: [
    { category: "PHYSICAL_AGENT", modality: "TECAR", bodyZone: "Rodilla anterior", durationMinutes: 10 },
    { category: "TAPING", modality: "OTHER", customName: "Vendaje rígido" },
  ],
  therapistNotes: "Bajar carga",
  createdAt: "2026-09-29T23:40:00.000Z",
  updatedAt: "2026-09-29T23:40:00.000Z",
};

describe("sessionToExerciseEntries", () => {
  it("round-trips exercises, sets, isometric holds and notes into the same payload", () => {
    const payload = toExercisePayload(sessionToExerciseEntries(session, counterIds()));

    expect(payload).toEqual([
      {
        name: "Step-up viejo",
        exerciseId: "exercise-1",
        isIsometric: false,
        durationMinutes: undefined,
        distanceKm: undefined,
        sets: [
          { position: 0, reps: 10, weightKg: 7.5, holdSeconds: undefined, notes: "lento" },
          { position: 1, reps: 8, weightKg: undefined, holdSeconds: undefined, notes: undefined },
        ],
        notes: "rodilla estable",
      },
      {
        name: "Wall sit",
        exerciseId: "exercise-2",
        isIsometric: true,
        durationMinutes: undefined,
        distanceKm: undefined,
        sets: [{ position: 0, reps: undefined, weightKg: undefined, holdSeconds: 45, notes: undefined }],
        notes: undefined,
      },
      {
        name: "Bicicleta",
        exerciseId: "exercise-3",
        isIsometric: false,
        durationMinutes: 12.5,
        distanceKm: 4.2,
        sets: [],
        notes: undefined,
      },
    ]);
  });

  it("turns an old aggregated prescription into equal sets", () => {
    const entries = sessionToExerciseEntries(
      {
        ...session,
        exercises: [
          { name: "Sentadilla", sets: [], legacyPrescription: { setCount: 3, reps: 12, weightKg: 5 } },
        ],
      },
      counterIds(),
    );

    expect(toExercisePayload(entries)[0].sets).toEqual([
      { position: 0, reps: 12, weightKg: 5, holdSeconds: undefined, notes: undefined },
      { position: 1, reps: 12, weightKg: 5, holdSeconds: undefined, notes: undefined },
      { position: 2, reps: 12, weightKg: 5, holdSeconds: undefined, notes: undefined },
    ]);
  });

  it("gives every entry and set its own draft id", () => {
    const entries = sessionToExerciseEntries(session, counterIds());
    const ids = entries.flatMap((entry) => [entry.id, ...entry.sets.map((set) => set.id)]);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("sessionToTreatmentDrafts", () => {
  it("round-trips treatments into the same payload", () => {
    expect(toTreatmentPayload(sessionToTreatmentDrafts(session, counterIds()))).toEqual([
      {
        category: "PHYSICAL_AGENT",
        modality: "TECAR",
        customName: undefined,
        bodyZone: "Rodilla anterior",
        durationMinutes: 10,
      },
      {
        category: "TAPING",
        modality: "OTHER",
        customName: "Vendaje rígido",
        bodyZone: undefined,
        durationMinutes: undefined,
      },
    ]);
  });
});
