"use client";

import Link from "next/link";
import { useState } from "react";

import { ModalSheet } from "@/components/modal-sheet";
import { formatExerciseCount, formatRoutinePreview } from "@/features/routines/routine-list";
import type { ExerciseEntryDraft } from "@/lib/exercise-entry-state";
import { addRoutineToSession, formatRoutineAddedMessage } from "@/lib/routine-state";
import type { Exercise, Routine } from "@/types/recovery";

interface RoutinePickerProps {
  catalog: Exercise[];
  entries: ExerciseEntryDraft[];
  nextId: (prefix: string) => string;
  onChange: (entries: ExerciseEntryDraft[]) => void;
  routines: Routine[];
}

export function RoutinePicker({ catalog, entries, nextId, onChange, routines }: RoutinePickerProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  function applyRoutine(routine: Routine) {
    const result = addRoutineToSession(entries, routine, catalog, nextId);
    onChange(result.entries);
    setMessage(formatRoutineAddedMessage(routine.name, result.added, result.skipped));
    setOpen(false);
  }

  return (
    <>
      <button
        className="rr-add-custom-exercise rr-use-routine"
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
        type="button"
      >
        Usar rutina
      </button>
      <p className="rr-routine-added" role="status">
        {message}
      </p>

      <ModalSheet onClose={() => setOpen(false)} open={open} title="Usar rutina">
        {routines.length === 0 ? (
          <div className="rr-exercise-catalog-empty">
            <strong>Aún no tienes rutinas</strong>
            <p>
              <Link href="/ejercicios/rutinas/nueva">Crea una rutina</Link> en Ejercicios para
              agregar varios ejercicios en un toque.
            </p>
          </div>
        ) : (
          <ul aria-label="Rutinas disponibles" className="rr-exercise-rows">
            {routines.map((routine) => (
              <li key={routine.id}>
                <button
                  className="rr-exercise-row rr-routine-row"
                  onClick={() => applyRoutine(routine)}
                  type="button"
                >
                  <span className="rr-routine-row-text">
                    <strong>{routine.name}</strong>
                    <small>{formatRoutinePreview(routine)}</small>
                  </span>
                  <span className="rr-exercise-row-summary">
                    {formatExerciseCount(routine.exercises.length)}
                  </span>
                  <b aria-hidden="true">+</b>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ModalSheet>
    </>
  );
}
