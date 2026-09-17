"use client";

import Link from "@/components/app-link";
import { useId, useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { ModalSheet } from "@/components/modal-sheet";
import { createRoutineFromSessionAction } from "@/features/routines/actions";

interface SaveSessionAsRoutineProps {
  sessionId: string;
  suggestedName: string;
}

export function SaveSessionAsRoutine({ sessionId, suggestedName }: SaveSessionAsRoutineProps) {
  const nameId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState<string | null>(null);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const { pending, run } = useActionFeedback();

  function save() {
    run(() => createRoutineFromSessionAction(sessionId, name), {
      success: "Rutina guardada",
      fallbackError: "No se pudo guardar la rutina.",
      onSuccess: (result) => {
        if (result.routineId) setRoutineId(result.routineId);
        setOpen(false);
      },
      onError: (message) => setError(message || null),
    });
  }

  return (
    <>
      {routineId ? (
        <p className="rr-routine-saved">
          <Link href={`/ejercicios/rutinas/${routineId}`}>Ver rutina</Link>
        </p>
      ) : (
        <button className="rr-success-secondary" onClick={() => setOpen(true)} type="button">
          Guardar como rutina
        </button>
      )}

      <ModalSheet
        footer={
          <>
            <button className="rr-modal-secondary" onClick={() => setOpen(false)} type="button">
              Cancelar
            </button>
            <button
              className="rr-modal-primary"
              disabled={pending || !name.trim()}
              onClick={save}
              type="button"
            >
              {pending ? "Guardando..." : "Guardar rutina"}
            </button>
          </>
        }
        onClose={() => setOpen(false)}
        open={open}
        title="Guardar como rutina"
      >
        <div className="rr-exercise-form">
          {error ? (
            <p className="rr-exercise-incomplete" role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          ) : null}
          <p className="rr-exercise-form-hint">
            Se guardarán los ejercicios y series de esta sesión, sin notas.
          </p>
          <label htmlFor={nameId}>
            <span>Nombre de la rutina</span>
            <input
              data-autofocus
              id={nameId}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              type="text"
              value={name}
            />
          </label>
        </div>
      </ModalSheet>
    </>
  );
}
