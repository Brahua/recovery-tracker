import { describe, expect, it } from "vitest";

import {
  addExerciseSet,
  createExerciseEntry,
  duplicateExerciseSet,
  isExerciseEntryComplete,
  removeExerciseSet,
  toExercisePayload,
  updateExerciseSet,
} from "@/lib/exercise-entry-state";

describe("exercise entry state", () => {
  it("creates an empty shortcut exercise without inventing set values", () => {
    expect(
      createExerciseEntry("exercise-1", "Step-up", "STEP_UP"),
    ).toEqual({
      id: "exercise-1",
      name: "Step-up",
      shortcutId: "STEP_UP",
      durationMinutes: "",
      distanceKm: "",
      notes: "",
      sets: [],
    });
  });

  it("adds, updates, duplicates, and removes sets immutably", () => {
    const original = createExerciseEntry("exercise-1", "Step-up", "STEP_UP");
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
    expect(duplicated.sets).toEqual([
      {
        id: "set-1",
        reps: "12",
        weightKg: "10.5",
        notes: "Controlado",
      },
      {
        id: "set-2",
        reps: "12",
        weightKg: "10.5",
        notes: "Controlado",
      },
    ]);
    expect(removed.sets.map((set) => set.id)).toEqual(["set-2"]);
  });

  it("serializes numbers and stable positions for the server boundary", () => {
    const entry = {
      ...createExerciseEntry("exercise-1", "Bicicleta", "BICICLETA"),
      durationMinutes: "12.5",
      distanceKm: "4.2",
      sets: [
        { id: "set-a", reps: "10", weightKg: "", notes: "" },
        { id: "set-b", reps: "8", weightKg: "12.5", notes: "Final" },
      ],
    };

    expect(toExercisePayload([entry])).toEqual([
      {
        name: "Bicicleta",
        shortcutId: "BICICLETA",
        durationMinutes: 12.5,
        distanceKm: 4.2,
        sets: [
          { position: 0, reps: 10 },
          { position: 1, reps: 8, weightKg: 12.5, notes: "Final" },
        ],
      },
    ]);
  });

  it("keeps invalid numeric drafts for server validation instead of hiding them", () => {
    const entry = {
      ...createExerciseEntry("exercise-1", "TKE", "TKE"),
      sets: [{ id: "set-a", reps: "abc", weightKg: "", notes: "" }],
    };

    expect(toExercisePayload([entry])[0]?.sets[0]?.reps).toBe("abc");
  });

  it("only counts exercises with a meaningful set, duration, or distance", () => {
    const empty = createExerciseEntry("exercise-1", "TKE", "TKE");
    const withReps = {
      ...empty,
      sets: [{ id: "set-1", reps: "12", weightKg: "", notes: "" }],
    };
    const withDuration = { ...empty, durationMinutes: "10" };

    expect(isExerciseEntryComplete(empty)).toBe(false);
    expect(isExerciseEntryComplete(withReps)).toBe(true);
    expect(isExerciseEntryComplete(withDuration)).toBe(true);
  });

  it("keeps a custom exercise incomplete until it has a name", () => {
    const unnamed = {
      ...createExerciseEntry("exercise-1", ""),
      sets: [{ id: "set-1", reps: "12", weightKg: "", notes: "" }],
    };

    expect(isExerciseEntryComplete(unnamed)).toBe(false);
  });
});
