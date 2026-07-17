"use client";

import { exerciseShortcuts } from "@/lib/constants/exercises";
import {
  addExerciseSet,
  createExerciseEntry,
  duplicateExerciseSet,
  removeExerciseSet,
  toExercisePayload,
  updateExerciseSet,
  type ExerciseEntryDraft,
} from "@/lib/exercise-entry-state";

interface ExerciseEntryEditorProps {
  entries: ExerciseEntryDraft[];
  onChange: (entries: ExerciseEntryDraft[]) => void;
}

interface ExerciseDetailProps {
  entry: ExerciseEntryDraft;
  onChange: (entry: ExerciseEntryDraft) => void;
  onRemove: () => void;
}

function nextId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function ExerciseDetail({ entry, onChange, onRemove }: ExerciseDetailProps) {
  const isCustom = entry.shortcutId === undefined;

  return (
    <article className="rr-exercise-detail">
      <div className="rr-exercise-detail-heading">
        {isCustom ? (
          <label>
            <span>Nombre del ejercicio</span>
            <input
              onChange={(event) => onChange({ ...entry, name: event.target.value })}
              placeholder="Ej. prensa de pierna"
              type="text"
              value={entry.name}
            />
          </label>
        ) : (
          <div>
            <small>Ejercicio</small>
            <h3>{entry.name}</h3>
          </div>
        )}
        <button onClick={onRemove} type="button">Quitar</button>
      </div>

      <div className="rr-exercise-metrics">
        <label>
          <span>Duración total <small>min · opcional</small></span>
          <input
            inputMode="decimal"
            min="0.5"
            onChange={(event) =>
              onChange({ ...entry, durationMinutes: event.target.value })
            }
            placeholder="10"
            step="0.5"
            type="number"
            value={entry.durationMinutes}
          />
        </label>
        <label>
          <span>Distancia total <small>km · opcional</small></span>
          <input
            inputMode="decimal"
            min="0.1"
            onChange={(event) =>
              onChange({ ...entry, distanceKm: event.target.value })
            }
            placeholder="2.5"
            step="0.1"
            type="number"
            value={entry.distanceKm}
          />
        </label>
      </div>

      <div className="rr-exercise-sets-heading">
        <div>
          <h4>Series</h4>
          <p>Registra cada serie por separado.</p>
        </div>
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
        <ol className="rr-exercise-set-list">
          {entry.sets.map((set, index) => (
            <li key={set.id}>
              <div className="rr-exercise-set-number">
                <strong>Serie {index + 1}</strong>
                <span>
                  <button
                    aria-label={`Duplicar serie ${index + 1}`}
                    onClick={() =>
                      onChange(
                        duplicateExerciseSet(entry, set.id, nextId("set")),
                      )
                    }
                    type="button"
                  >
                    Duplicar
                  </button>
                  <button
                    aria-label={`Eliminar serie ${index + 1}`}
                    onClick={() => onChange(removeExerciseSet(entry, set.id))}
                    type="button"
                  >
                    Eliminar
                  </button>
                </span>
              </div>
              <div className="rr-exercise-set-fields">
                <label>
                  <span>Repeticiones</span>
                  <input
                    inputMode="numeric"
                    min="1"
                    onChange={(event) =>
                      onChange(
                        updateExerciseSet(entry, set.id, {
                          reps: event.target.value,
                        }),
                      )
                    }
                    placeholder="12"
                    step="1"
                    type="number"
                    value={set.reps}
                  />
                </label>
                <label>
                  <span>Peso <small>kg</small></span>
                  <input
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      onChange(
                        updateExerciseSet(entry, set.id, {
                          weightKg: event.target.value,
                        }),
                      )
                    }
                    placeholder="0"
                    step="0.5"
                    type="number"
                    value={set.weightKg}
                  />
                </label>
                <label className="rr-exercise-set-note">
                  <span>Nota <small>opcional</small></span>
                  <input
                    maxLength={500}
                    onChange={(event) =>
                      onChange(
                        updateExerciseSet(entry, set.id, {
                          notes: event.target.value,
                        }),
                      )
                    }
                    placeholder="Ej. última repetición difícil"
                    type="text"
                    value={set.notes}
                  />
                </label>
              </div>
            </li>
          ))}
        </ol>
      )}

      <label className="rr-exercise-note">
        <span>Nota del ejercicio <small>opcional</small></span>
        <textarea
          maxLength={500}
          onChange={(event) => onChange({ ...entry, notes: event.target.value })}
          placeholder="Algo general sobre este ejercicio..."
          value={entry.notes}
        />
      </label>
    </article>
  );
}

export function ExerciseEntryEditor({
  entries,
  onChange,
}: ExerciseEntryEditorProps) {
  const selectedShortcuts = new Set(
    entries.flatMap((entry) => (entry.shortcutId ? [entry.shortcutId] : [])),
  );

  function toggleShortcut(shortcutId: (typeof exerciseShortcuts)[number]["id"]) {
    if (selectedShortcuts.has(shortcutId)) {
      onChange(entries.filter((entry) => entry.shortcutId !== shortcutId));
      return;
    }

    const shortcut = exerciseShortcuts.find((item) => item.id === shortcutId);
    if (!shortcut) return;

    onChange([
      ...entries,
      createExerciseEntry(`shortcut-${shortcut.id}`, shortcut.label, shortcut.id),
    ]);
  }

  function updateEntry(nextEntry: ExerciseEntryDraft) {
    onChange(entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)));
  }

  return (
    <>
      <div className="rr-exercise-list" aria-label="Ejercicios disponibles">
        {exerciseShortcuts.map((exercise) => {
          const selected = selectedShortcuts.has(exercise.id);
          return (
            <button
              aria-pressed={selected}
              className={selected ? "is-selected" : ""}
              key={exercise.id}
              onClick={() => toggleShortcut(exercise.id)}
              type="button"
            >
              <b aria-hidden="true">{selected ? "✓" : "+"}</b>
              <span>{exercise.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rr-selected-exercises">
        {entries.map((entry) => (
          <ExerciseDetail
            entry={entry}
            key={entry.id}
            onChange={updateEntry}
            onRemove={() => onChange(entries.filter((item) => item.id !== entry.id))}
          />
        ))}
      </div>

      <button
        className="rr-add-custom-exercise"
        onClick={() =>
          onChange([
            ...entries,
            createExerciseEntry(nextId("exercise"), ""),
          ])
        }
        type="button"
      >
        + Añadir otro ejercicio
      </button>

      <input
        name="exercisesPayload"
        type="hidden"
        value={JSON.stringify(toExercisePayload(entries))}
      />
    </>
  );
}
