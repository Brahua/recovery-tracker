"use client";

import { useState, type ReactNode } from "react";

import { ExerciseNameCombobox } from "@/components/exercise-name-combobox";
import { ModalSheet } from "@/components/modal-sheet";
import {
  addExerciseSet,
  applyExerciseDefaults,
  createExerciseEntry,
  duplicateExerciseSet,
  findRepeatedEntryIds,
  isEntryReady,
  isExerciseEntryEmpty,
  removeExerciseSet,
  resolveEntryExerciseId,
  toExerciseSummaryInput,
  unlinkExerciseEntry,
  updateExerciseSet,
  type ExerciseEditorMode,
  type ExerciseEntryDraft,
} from "@/lib/exercise-entry-state";
import { createDraftId as nextId } from "@/lib/draft-id";
import { selectMostUsedExercises } from "@/lib/exercise-name";
import { summarizeExercise } from "@/lib/exercise-summary";
import type { Exercise } from "@/types/recovery";

interface ExerciseEntryEditorProps {
  /** Extra buttons shown next to "+ Añadir ejercicio" (e.g. the session routine picker). */
  addActions?: ReactNode;
  catalog: Exercise[];
  entries: ExerciseEntryDraft[];
  mode?: ExerciseEditorMode;
  onChange: (entries: ExerciseEntryDraft[]) => void;
}

interface ExerciseDetailProps {
  catalog: Exercise[];
  entry: ExerciseEntryDraft;
  excludeIds: string[];
  mode: ExerciseEditorMode;
  onChange: (entry: ExerciseEntryDraft) => void;
  repeated: boolean;
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function incompleteMessage(repeated: boolean, mode: ExerciseEditorMode) {
  if (repeated) {
    return mode === "routine"
      ? "Este ejercicio ya está en la rutina"
      : "Este ejercicio ya está en la sesión";
  }
  return mode === "routine" ? "Escribe o elige el ejercicio" : "Falta completar este ejercicio";
}

function ExerciseDetail({ catalog, entry, excludeIds, mode, onChange, repeated }: ExerciseDetailProps) {
  const [showMetrics, setShowMetrics] = useState(
    hasText(entry.durationMinutes) || hasText(entry.distanceKm),
  );
  const [showExerciseNote, setShowExerciseNote] = useState(hasText(entry.notes));
  const [openSetNotes, setOpenSetNotes] = useState(
    () => new Set(entry.sets.filter((set) => hasText(set.notes)).map((set) => set.id)),
  );
  const incomplete = repeated || !isEntryReady(entry, mode);
  const warningId = `${entry.id}-incomplete`;
  const isometricId = `${entry.id}-isometric`;

  function toggleSetNote(setId: string) {
    setOpenSetNotes((current) => {
      const next = new Set(current);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  }

  return (
    <div
      aria-describedby={incomplete ? warningId : undefined}
      className={`rr-exercise-detail ${incomplete ? "is-incomplete" : ""}`}
    >
      {entry.exerciseId ? (
        <div className="rr-exercise-detail-heading">
          <div>
            <small>Ejercicio</small>
            <h3>{entry.name}</h3>
          </div>
          <button onClick={() => onChange(unlinkExerciseEntry(entry))} type="button">
            Cambiar
          </button>
        </div>
      ) : (
        <ExerciseNameCombobox
          autoFocus={!hasText(entry.name)}
          catalog={catalog}
          excludeIds={excludeIds}
          onRestore={(exercise) =>
            onChange({
              ...applyExerciseDefaults(entry, exercise, () => nextId("set")),
              // Stay unlinked: the server reactivates the archived exercise by name.
              exerciseId: undefined,
            })
          }
          onSelect={(exercise) =>
            onChange(applyExerciseDefaults(entry, exercise, () => nextId("set")))
          }
          onValueChange={(name) => onChange({ ...entry, name })}
          value={entry.name}
        />
      )}

      <label className="rr-exercise-isometric" htmlFor={isometricId}>
        <input
          checked={entry.isIsometric}
          id={isometricId}
          onChange={(event) => onChange({ ...entry, isIsometric: event.target.checked })}
          type="checkbox"
        />
        <span>
          <strong>Isométrico</strong>
          <small>Registra cuántos segundos mantienes la posición</small>
        </span>
      </label>

      {incomplete && (
        <p className="rr-exercise-incomplete" id={warningId} role="status">
          <span aria-hidden="true">!</span>
          {incompleteMessage(repeated, mode)}
        </p>
      )}

      <div className="rr-exercise-sets-heading">
        <h4>Series</h4>
        <button
          onClick={() => onChange(addExerciseSet(entry, nextId("set")))}
          type="button"
        >
          + Añadir serie
        </button>
      </div>

      {entry.sets.length === 0 ? (
        <p className="rr-exercise-sets-empty">
          Añade una serie o registra duración/distancia para completar el ejercicio.
        </p>
      ) : (
        <ol className={`rr-exercise-set-list ${entry.isIsometric ? "is-isometric" : ""}`}>
          {entry.sets.map((set, index) => {
            const number = index + 1;
            const noteOpen = openSetNotes.has(set.id);

            return (
              <li key={set.id}>
                <span aria-hidden="true" className="rr-exercise-set-index">{number}</span>
                <div className="rr-exercise-set-fields">
                  {entry.isIsometric ? (
                    <label>
                      <span>Segundos</span>
                      <input
                        id={`${set.id}-hold`}
                        inputMode="numeric"
                        min="1"
                        onChange={(event) =>
                          onChange(updateExerciseSet(entry, set.id, { holdSeconds: event.target.value }))
                        }
                        placeholder="45"
                        step="1"
                        type="number"
                        value={set.holdSeconds}
                      />
                    </label>
                  ) : null}
                  <label>
                    <span>{entry.isIsometric ? "Rep." : "Repeticiones"}</span>
                    <input
                      aria-label={entry.isIsometric ? `Repeticiones serie ${number} (opcional)` : undefined}
                      id={`${set.id}-reps`}
                      inputMode="numeric"
                      min="1"
                      onChange={(event) =>
                        onChange(updateExerciseSet(entry, set.id, { reps: event.target.value }))
                      }
                      placeholder={entry.isIsometric ? "—" : "12"}
                      step="1"
                      type="number"
                      value={set.reps}
                    />
                  </label>
                  <label>
                    <span>Peso <small>kg</small></span>
                    <input
                      id={`${set.id}-weight`}
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        onChange(updateExerciseSet(entry, set.id, { weightKg: event.target.value }))
                      }
                      placeholder="0"
                      step="0.5"
                      type="number"
                      value={set.weightKg}
                    />
                  </label>
                </div>
                <div className="rr-exercise-set-actions">
                  <button
                    aria-expanded={noteOpen}
                    aria-label={`Nota de la serie ${number}`}
                    className={hasText(set.notes) ? "has-value" : ""}
                    onClick={() => toggleSetNote(set.id)}
                    title="Nota"
                    type="button"
                  >
                    <span aria-hidden="true">✎</span>
                  </button>
                  <button
                    aria-label={`Duplicar serie ${number}`}
                    onClick={() => onChange(duplicateExerciseSet(entry, set.id, nextId("set")))}
                    title="Duplicar"
                    type="button"
                  >
                    <span aria-hidden="true">⧉</span>
                  </button>
                  <button
                    aria-label={`Eliminar serie ${number}`}
                    onClick={() => onChange(removeExerciseSet(entry, set.id))}
                    title="Eliminar"
                    type="button"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
                {noteOpen ? (
                  <label className="rr-exercise-set-note">
                    <span>Nota de la serie {number}</span>
                    <input
                      autoFocus={!hasText(set.notes)}
                      id={`${set.id}-note`}
                      maxLength={500}
                      onChange={(event) =>
                        onChange(updateExerciseSet(entry, set.id, { notes: event.target.value }))
                      }
                      placeholder="Ej. última repetición difícil"
                      type="text"
                      value={set.notes}
                    />
                  </label>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {showMetrics ? (
        <div className="rr-exercise-metrics">
          <label>
            <span>Duración total <small>min</small></span>
            <input
              id={`${entry.id}-duration`}
              inputMode="decimal"
              min="0.5"
              onChange={(event) => onChange({ ...entry, durationMinutes: event.target.value })}
              placeholder="10"
              step="0.5"
              type="number"
              value={entry.durationMinutes}
            />
          </label>
          <label>
            <span>Distancia total <small>km</small></span>
            <input
              id={`${entry.id}-distance`}
              inputMode="decimal"
              min="0.1"
              onChange={(event) => onChange({ ...entry, distanceKm: event.target.value })}
              placeholder="2.5"
              step="0.1"
              type="number"
              value={entry.distanceKm}
            />
          </label>
        </div>
      ) : (
        <button className="rr-exercise-disclosure" onClick={() => setShowMetrics(true)} type="button">
          + Duración o distancia
        </button>
      )}

      {showExerciseNote ? (
        <label className="rr-exercise-note">
          <span>Nota del ejercicio</span>
          <textarea
            autoFocus={!hasText(entry.notes)}
            id={`${entry.id}-note`}
            maxLength={500}
            onChange={(event) => onChange({ ...entry, notes: event.target.value })}
            placeholder="Algo general sobre este ejercicio..."
            value={entry.notes}
          />
        </label>
      ) : (
        <button className="rr-exercise-disclosure" onClick={() => setShowExerciseNote(true)} type="button">
          + Nota del ejercicio
        </button>
      )}
    </div>
  );
}

export function ExerciseEntryEditor({
  addActions,
  catalog,
  entries,
  mode = "session",
  onChange,
}: ExerciseEntryEditorProps) {
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const openEntry = entries.find((entry) => entry.id === openEntryId);
  const mostUsed = selectMostUsedExercises(catalog);
  const repeatedEntryIds = findRepeatedEntryIds(entries, catalog);
  const usedExerciseIds = entries.flatMap((entry) => {
    const exerciseId = resolveEntryExerciseId(entry, catalog);
    return exerciseId ? [exerciseId] : [];
  });

  function toggleExercise(exercise: Exercise) {
    if (usedExerciseIds.includes(exercise.id)) {
      onChange(
        entries.filter((entry) => resolveEntryExerciseId(entry, catalog) !== exercise.id),
      );
      return;
    }

    onChange([
      ...entries,
      applyExerciseDefaults(createExerciseEntry(nextId("exercise")), exercise, () => nextId("set")),
    ]);
  }

  function addExercise() {
    const entry = createExerciseEntry(nextId("exercise"));
    onChange([...entries, entry]);
    setOpenEntryId(entry.id);
  }

  function updateEntry(nextEntry: ExerciseEntryDraft) {
    onChange(entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)));
  }

  function removeEntry(entryId: string) {
    onChange(entries.filter((entry) => entry.id !== entryId));
  }

  function closeModal() {
    if (openEntry && isExerciseEntryEmpty(openEntry)) {
      removeEntry(openEntry.id);
    }
    setOpenEntryId(null);
  }

  return (
    <>
      {mostUsed.length > 0 ? (
        <div className="rr-exercise-quick">
          <p id="rr-exercise-quick-label">Más usados</p>
          <div aria-labelledby="rr-exercise-quick-label" className="rr-exercise-list" role="group">
            {mostUsed.map((exercise) => {
              const selected = usedExerciseIds.includes(exercise.id);
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? "is-selected" : ""}
                  key={exercise.id}
                  onClick={() => toggleExercise(exercise)}
                  type="button"
                >
                  <b aria-hidden="true">{selected ? "✓" : "+"}</b>
                  <span>{exercise.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <ul
          aria-label={mode === "routine" ? "Ejercicios de la rutina" : "Ejercicios de la sesión"}
          className="rr-exercise-rows"
        >
          {entries.map((entry) => {
            const repeated = repeatedEntryIds.has(entry.id);
            const complete = !repeated && isEntryReady(entry, mode);
            const summary = summarizeExercise(toExerciseSummaryInput(entry)) || "Sin plan";

            return (
              <li key={entry.id}>
                <button
                  className={`rr-exercise-row ${complete ? "" : "is-incomplete"}`}
                  onClick={() => setOpenEntryId(entry.id)}
                  type="button"
                >
                  <span className="rr-exercise-row-name">
                    {!complete ? <i aria-hidden="true">!</i> : null}
                    <strong>{entry.name.trim() || "Sin nombre"}</strong>
                    {entry.isIsometric ? <em>Isométrico</em> : null}
                  </span>
                  <span className="rr-exercise-row-summary">
                    {repeated ? "Repetido" : complete ? summary : "Completar"}
                  </span>
                  <b aria-hidden="true">›</b>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="rr-exercise-add-actions">
        {addActions}
        <button className="rr-add-custom-exercise" onClick={addExercise} type="button">
          + Añadir ejercicio
        </button>
      </div>

      <ModalSheet
        footer={
          openEntry ? (
            <>
              <button
                className="rr-modal-secondary"
                onClick={() => {
                  removeEntry(openEntry.id);
                  setOpenEntryId(null);
                }}
                type="button"
              >
                Quitar ejercicio
              </button>
              <button className="rr-modal-primary" onClick={closeModal} type="button">
                Listo
              </button>
            </>
          ) : null
        }
        onClose={closeModal}
        open={Boolean(openEntry)}
        title={openEntry?.exerciseId || openEntry?.name.trim() ? "Ejercicio" : "Añadir ejercicio"}
      >
        {openEntry ? (
          <ExerciseDetail
            catalog={catalog}
            entry={openEntry}
            excludeIds={entries.flatMap((entry) => {
              const exerciseId =
                entry.id === openEntry.id ? undefined : resolveEntryExerciseId(entry, catalog);
              return exerciseId ? [exerciseId] : [];
            })}
            key={openEntry.id}
            mode={mode}
            onChange={updateEntry}
            repeated={repeatedEntryIds.has(openEntry.id)}
          />
        ) : null}
      </ModalSheet>
    </>
  );
}
