"use client";

import Link from "@/components/app-link";
import { useId, useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { useAppRouter } from "@/components/use-app-router";
import { ExerciseEntryEditor } from "@/components/exercise-entry-editor";
import { deleteRoutineAction, saveRoutineAction } from "@/features/routines/actions";
import { createDraftId } from "@/lib/draft-id";
import {
  findRepeatedEntryIds,
  isEntryReady,
  type ExerciseEntryDraft,
} from "@/lib/exercise-entry-state";
import { routineToEntries, toRoutinePayload } from "@/lib/routine-state";
import type { Exercise, Routine } from "@/types/recovery";

interface RoutineEditorProps {
  catalog: Exercise[];
  routine?: Routine;
}

const routinesHref = "/ejercicios?seccion=rutinas";

export function RoutineEditor({ catalog, routine }: RoutineEditorProps) {
  const router = useAppRouter();
  const nameId = useId();
  const { pending: actionPending, run } = useActionFeedback();
  const pending = actionPending || router.pending;
  const [name, setName] = useState(routine?.name ?? "");
  const [entries, setEntries] = useState<ExerciseEntryDraft[]>(() =>
    routine ? routineToEntries(routine, createDraftId) : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const repeatedEntryIds = findRepeatedEntryIds(entries, catalog);
  const readyCount = entries.filter(
    (entry) => isEntryReady(entry, "routine") && !repeatedEntryIds.has(entry.id),
  ).length;
  const canSave =
    name.trim().length > 0 && entries.length > 0 && readyCount === entries.length && !pending;

  function save() {
    run(() => saveRoutineAction(routine?.id ?? null, toRoutinePayload(name, entries)), {
      success: "Rutina guardada",
      fallbackError: "No se pudo guardar la rutina.",
      onSuccess: () => router.push(routinesHref),
      onError: (message) => setError(message || null),
    });
  }

  function remove() {
    if (!routine) return;
    run(() => deleteRoutineAction(routine.id), {
      success: "Rutina eliminada",
      fallbackError: "No se pudo eliminar la rutina.",
      onSuccess: () => router.push(routinesHref),
      onError: (message) => setError(message || null),
    });
  }

  return (
    <section className="rr-exercise-catalog rr-routine-editor">
      <header className="rr-routine-editor-header">
        <Link href={routinesHref}>
          <span aria-hidden="true">‹</span> Rutinas
        </Link>
        <h1 className="rr-display">{routine ? "Editar rutina" : "Nueva rutina"}</h1>
      </header>

      {error ? (
        <p className="rr-exercise-incomplete" role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}

      <label className="rr-routine-name" htmlFor={nameId}>
        <span>Nombre de la rutina</span>
        <input
          id={nameId}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Core rodilla"
          type="text"
          value={name}
        />
      </label>

      <div className="rr-form-card rr-exercises-card">
        <div className="rr-form-section-heading">
          <span aria-hidden="true" className={`rr-step-badge ${canSave ? "is-complete" : ""}`}>
            {canSave ? "✓" : ""}
          </span>
          <h2>Ejercicios</h2>
          <div>
            <span className="rr-exercise-actions">
              <b>{entries.length}/20</b>
            </span>
          </div>
        </div>
        <ExerciseEntryEditor catalog={catalog} entries={entries} mode="routine" onChange={setEntries} />
      </div>

      <footer className="rr-exercise-form-actions rr-routine-editor-actions">
        {routine ? (
          confirmDelete ? (
            <span className="rr-routine-delete-confirm">
              <button className="rr-modal-secondary" onClick={() => setConfirmDelete(false)} type="button">
                Cancelar
              </button>
              <button className="rr-modal-secondary is-danger" disabled={pending} onClick={remove} type="button">
                Confirmar eliminación
              </button>
            </span>
          ) : (
            <button className="rr-modal-secondary" onClick={() => setConfirmDelete(true)} type="button">
              Eliminar
            </button>
          )
        ) : (
          <span />
        )}
        <button className="rr-modal-primary" disabled={!canSave} onClick={save} type="button">
          {pending ? "Guardando..." : "Guardar rutina"}
        </button>
      </footer>
    </section>
  );
}
