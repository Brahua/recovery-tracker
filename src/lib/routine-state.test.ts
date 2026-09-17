import { describe, expect, it } from "vitest";

import { applyExerciseDefaults, createExerciseEntry } from "@/lib/exercise-entry-state";
import {
  addRoutineToSession,
  formatRoutineAddedMessage,
  routineToEntries,
  suggestRoutineName,
  toRoutinePayload,
} from "@/lib/routine-state";
import { routineInputSchema } from "@/lib/validation/routines";
import type { Exercise, Routine } from "@/types/recovery";

const timestamp = "2026-09-17T00:00:00.000Z";

function exercise(id: string, name: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id,
    name,
    defaultIsometric: false,
    sessionCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

const wallSit = exercise("7f0d3c52-1d7e-4b8e-9c1a-4f0a8b6f1a01", "Wall sit", { defaultIsometric: true });
const stepUp = exercise("7f0d3c52-1d7e-4b8e-9c1a-4f0a8b6f1a02", "Step-up");
const bicycle = exercise("7f0d3c52-1d7e-4b8e-9c1a-4f0a8b6f1a03", "Bicicleta", {
  defaultDurationMinutes: 10,
});
const catalog = [wallSit, stepUp, bicycle];

const routine: Routine = {
  id: "routine-1",
  name: "Core rodilla",
  createdAt: timestamp,
  updatedAt: timestamp,
  exercises: [
    { exerciseId: wallSit.id, name: "Wall sit", isIsometric: true, sets: [{ position: 0, holdSeconds: 45 }] },
    { exerciseId: stepUp.id, name: "Step-up", isIsometric: false, sets: [{ position: 0, reps: 12, weightKg: 5 }] },
    { exerciseId: bicycle.id, name: "Bicicleta", isIsometric: false, sets: [] },
  ],
};

function sequentialIds() {
  let next = 0;
  return (prefix: string) => `${prefix}-${++next}`;
}

describe("addRoutineToSession", () => {
  it("appends routine exercises with their plan and skips the ones already logged", () => {
    const existing = applyExerciseDefaults(createExerciseEntry("mine"), stepUp, () => "set-mine");
    const result = addRoutineToSession([existing], routine, catalog, sequentialIds());

    expect(result.added).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.entries.map((entry) => entry.name)).toEqual(["Step-up", "Wall sit", "Bicicleta"]);
    expect(result.entries[0]).toBe(existing);
    expect(result.entries[1]).toMatchObject({
      exerciseId: wallSit.id,
      isIsometric: true,
      sets: [{ holdSeconds: "45", reps: "", weightKg: "" }],
    });
  });

  it("uses catalog defaults when the routine has no plan for an exercise", () => {
    const result = addRoutineToSession([], routine, catalog, sequentialIds());

    expect(result.entries[2]).toMatchObject({ name: "Bicicleta", durationMinutes: "10" });
  });

  it("skips typed names that match a routine exercise", () => {
    const typed = createExerciseEntry("typed", "wall  SIT");
    const result = addRoutineToSession([typed], routine, catalog, sequentialIds());

    expect(result.skipped).toBe(1);
    expect(result.entries.filter((entry) => entry.name.toLowerCase().includes("wall"))).toHaveLength(1);
  });
});

describe("routine drafts", () => {
  it("round-trips a routine through editor drafts into a valid payload", () => {
    const entries = routineToEntries(routine, sequentialIds());
    const payload = toRoutinePayload("  Core rodilla ", entries);

    expect(entries[2]?.durationMinutes).toBe("");
    expect(payload).toEqual({
      name: "Core rodilla",
      exercises: [
        { name: "Wall sit", exerciseId: wallSit.id, isIsometric: true, sets: [{ position: 0, holdSeconds: 45 }] },
        { name: "Step-up", exerciseId: stepUp.id, isIsometric: false, sets: [{ position: 0, reps: 12, weightKg: 5 }] },
        { name: "Bicicleta", exerciseId: bicycle.id, isIsometric: false, sets: [] },
      ],
    });
    expect(routineInputSchema.safeParse(payload).success).toBe(true);
  });

  it("drops empty and notes-only sets from the plan", () => {
    const entry = {
      ...createExerciseEntry("e", "Step-up"),
      sets: [
        { id: "a", reps: "", weightKg: "", holdSeconds: "", notes: "solo nota" },
        { id: "b", reps: "10", weightKg: "", holdSeconds: "", notes: "" },
      ],
    };

    expect(toRoutinePayload("R", [entry]).exercises[0]?.sets).toEqual([{ position: 0, reps: 10 }]);
  });
});

describe("routineInputSchema", () => {
  it("requires a name and between 1 and 20 exercises without repeats", () => {
    const item = { name: "Step-up", sets: [] };

    expect(routineInputSchema.safeParse({ name: " ", exercises: [item] }).success).toBe(false);
    expect(routineInputSchema.safeParse({ name: "R", exercises: [] }).success).toBe(false);
    expect(
      routineInputSchema.safeParse({ name: "R", exercises: Array.from({ length: 21 }, (_, i) => ({ name: `E${i}`, sets: [] })) }).success,
    ).toBe(false);
    expect(
      routineInputSchema.safeParse({ name: "R", exercises: [item, { name: "STEP-UP", sets: [] }] }).success,
    ).toBe(false);
  });

  it("rejects hold-only sets when the exercise is not isometric", () => {
    expect(
      routineInputSchema.safeParse({
        name: "R",
        exercises: [{ name: "Wall sit", sets: [{ position: 0, holdSeconds: 30 }] }],
      }).success,
    ).toBe(false);
  });
});

describe("routine messages", () => {
  it("describes added and skipped exercises", () => {
    expect(formatRoutineAddedMessage("Core rodilla", 4, 1)).toBe(
      'Se agregaron 4 ejercicios de "Core rodilla" · 1 ya estaba',
    );
    expect(formatRoutineAddedMessage("Core", 1, 0)).toBe('Se agregó 1 ejercicio de "Core"');
    expect(formatRoutineAddedMessage("Core", 0, 3)).toBe('No se agregaron ejercicios de "Core" · 3 ya estaban');
  });

  it("suggests a routine name from the session type and local date", () => {
    expect(suggestRoutineName("PHYSIOTHERAPY", "2026-09-18T03:00:00.000Z", "America/Lima")).toBe(
      "Fisio guiada 17 sep",
    );
  });
});
