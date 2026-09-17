import { describe, expect, it } from "vitest";

import {
  addExerciseSet,
  applyExerciseDefaults,
  createExerciseEntry,
  duplicateExerciseSet,
  findRepeatedEntryIds,
  isExerciseEntryComplete,
  isEntryReady,
  isExerciseEntryEmpty,
  removeExerciseSet,
  toExercisePayload,
  toExerciseSummaryInput,
  unlinkExerciseEntry,
  updateExerciseSet,
} from "@/lib/exercise-entry-state";
import type { Exercise } from "@/types/recovery";

const wallSit: Exercise = {
  id: "8d5b9f0e-4c1a-4a53-9a1e-2f1b7c3d9e10",
  name: "Wall sit",
  defaultIsometric: true,
  defaultSetCount: 3,
  defaultHoldSeconds: 45,
  sessionCount: 0,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
};

function sequentialIds() {
  let next = 0;
  return () => `set-${++next}`;
}

describe("exercise entry state", () => {
  it("creates an empty entry without inventing set values", () => {
    expect(createExerciseEntry("exercise-1")).toEqual({
      id: "exercise-1",
      name: "",
      isIsometric: false,
      durationMinutes: "",
      distanceKm: "",
      notes: "",
      sets: [],
    });
  });

  it("adds, updates, duplicates, and removes sets immutably", () => {
    const original = createExerciseEntry("exercise-1", "Step-up");
    const withSet = addExerciseSet(original, "set-1");
    const updated = updateExerciseSet(withSet, "set-1", {
      reps: "12",
      weightKg: "10.5",
      notes: "Controlado",
    });
    const duplicated = duplicateExerciseSet(updated, "set-1", "set-2");
    const removed = removeExerciseSet(duplicated, "set-1");

    expect(original.sets).toEqual([]);
    expect(updated.sets[0]).toMatchObject({ reps: "12", weightKg: "10.5" });
    expect(duplicated.sets[1]).toEqual({
      id: "set-2",
      reps: "12",
      weightKg: "10.5",
      holdSeconds: "",
      notes: "Controlado",
    });
    expect(removed.sets.map((set) => set.id)).toEqual(["set-2"]);
  });

  it("applies catalog defaults to an empty entry", () => {
    const entry = applyExerciseDefaults(
      createExerciseEntry("exercise-1", "wall"),
      { ...wallSit, defaultDurationMinutes: 5 },
      sequentialIds(),
    );

    expect(entry).toMatchObject({
      exerciseId: wallSit.id,
      name: "Wall sit",
      isIsometric: true,
      durationMinutes: "5",
    });
    expect(entry.sets).toEqual([
      { id: "set-1", reps: "", weightKg: "", holdSeconds: "45", notes: "" },
      { id: "set-2", reps: "", weightKg: "", holdSeconds: "45", notes: "" },
      { id: "set-3", reps: "", weightKg: "", holdSeconds: "45", notes: "" },
    ]);
  });

  it("never overwrites values the user already entered", () => {
    const typed = {
      ...addExerciseSet(createExerciseEntry("exercise-1", "wall"), "mine"),
      durationMinutes: "8",
    };
    const entry = applyExerciseDefaults(
      typed,
      { ...wallSit, defaultDurationMinutes: 5 },
      sequentialIds(),
    );

    expect(entry.durationMinutes).toBe("8");
    expect(entry.isIsometric).toBe(false);
    expect(entry.sets.map((set) => set.id)).toEqual(["mine"]);
  });

  it("unlinks an entry so the name can be searched again", () => {
    const linked = applyExerciseDefaults(createExerciseEntry("e"), wallSit, sequentialIds());

    expect(unlinkExerciseEntry(linked)).toMatchObject({ exerciseId: undefined, name: "" });
  });

  it("serializes numbers, stable positions and catalog links for the server boundary", () => {
    const entry = {
      ...createExerciseEntry("exercise-1", "Bicicleta"),
      exerciseId: wallSit.id,
      durationMinutes: "12.5",
      distanceKm: "4.2",
      sets: [
        { id: "set-a", reps: "10", weightKg: "", holdSeconds: "30", notes: "" },
        { id: "set-b", reps: "8", weightKg: "12.5", holdSeconds: "", notes: "Final" },
      ],
    };

    expect(toExercisePayload([entry])).toEqual([
      {
        name: "Bicicleta",
        exerciseId: wallSit.id,
        isIsometric: false,
        durationMinutes: 12.5,
        distanceKm: 4.2,
        sets: [
          { position: 0, reps: 10 },
          { position: 1, reps: 8, weightKg: 12.5, notes: "Final" },
        ],
      },
    ]);
  });

  it("sends hold seconds only for isometric entries", () => {
    const entry = {
      ...createExerciseEntry("exercise-1", "Wall sit"),
      isIsometric: true,
      sets: [{ id: "set-a", reps: "", weightKg: "", holdSeconds: "45", notes: "" }],
    };

    expect(toExercisePayload([entry])[0]?.sets).toEqual([{ position: 0, holdSeconds: 45 }]);
    expect(isExerciseEntryComplete(entry)).toBe(true);
    expect(isExerciseEntryComplete({ ...entry, isIsometric: false })).toBe(false);
  });

  it("keeps invalid numeric drafts for server validation instead of hiding them", () => {
    const entry = {
      ...createExerciseEntry("exercise-1", "Wall sit"),
      sets: [{ id: "set-a", reps: "abc", weightKg: "", holdSeconds: "", notes: "" }],
    };

    expect(toExercisePayload([entry])[0]?.sets[0]?.reps).toBe("abc");
  });

  it("only counts exercises with a meaningful set, duration, or distance", () => {
    const empty = createExerciseEntry("exercise-1", "Wall sit");
    const withReps = {
      ...empty,
      sets: [{ id: "set-1", reps: "12", weightKg: "", holdSeconds: "", notes: "" }],
    };
    const withDuration = { ...empty, durationMinutes: "10" };

    expect(isExerciseEntryComplete(empty)).toBe(false);
    expect(isExerciseEntryComplete(withReps)).toBe(true);
    expect(isExerciseEntryComplete(withDuration)).toBe(true);
  });

  it("keeps an unnamed exercise incomplete and detects untouched entries", () => {
    const unnamed = {
      ...createExerciseEntry("exercise-1"),
      sets: [{ id: "set-1", reps: "12", weightKg: "", holdSeconds: "", notes: "" }],
    };

    expect(isExerciseEntryComplete(unnamed)).toBe(false);
    expect(isExerciseEntryEmpty(unnamed)).toBe(false);
    expect(isExerciseEntryEmpty(addExerciseSet(createExerciseEntry("e"), "s"))).toBe(true);
  });

  it("builds summary input from meaningful sets only", () => {
    const entry = {
      ...createExerciseEntry("exercise-1", "Wall sit"),
      isIsometric: true,
      sets: [
        { id: "a", reps: "", weightKg: "", holdSeconds: "45", notes: "" },
        { id: "b", reps: "", weightKg: "", holdSeconds: "", notes: "" },
      ],
    };

    expect(toExerciseSummaryInput(entry)).toEqual({
      isIsometric: true,
      sets: [{ holdSeconds: 45, reps: undefined, weightKg: undefined }],
      durationMinutes: undefined,
      distanceKm: undefined,
    });
  });

  it("flags later entries that repeat an exercise by link or by typed name", () => {
    const linked = applyExerciseDefaults(createExerciseEntry("a"), wallSit, sequentialIds());
    const typedSame = createExerciseEntry("b", "WALL  sít");
    const typedNew = createExerciseEntry("c", "Prensa");
    const typedNewAgain = createExerciseEntry("d", "prensa ");
    const unnamed = createExerciseEntry("e");

    expect(
      [...findRepeatedEntryIds([linked, typedSame, typedNew, typedNewAgain, unnamed, createExerciseEntry("f")], [wallSit])],
    ).toEqual(["b", "d"]);
  });

  it("accepts a named entry without plan only in routine mode", () => {
    const named = createExerciseEntry("e", "Step-up");

    expect(isEntryReady(named, "routine")).toBe(true);
    expect(isEntryReady(named, "session")).toBe(false);
    expect(isEntryReady(createExerciseEntry("e"), "routine")).toBe(false);
  });
});
