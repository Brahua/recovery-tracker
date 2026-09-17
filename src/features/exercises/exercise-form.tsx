"use client";

import { useId, useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import {
  mergeExercisesAction,
  saveExerciseAction,
  setExerciseArchivedAction,
  type ExerciseActionResult,
} from "@/features/exercises/actions";
import type { Exercise } from "@/types/recovery";

interface ExerciseFormProps {
  exercise?: Exercise;
  exercises: Exercise[];
  onDone: () => void;
}

function toDraft(value: number | undefined) {
  return value === undefined ? "" : `${value}`;
}

interface NumberFieldProps {
  label: string;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  placeholder?: string;
}

function NumberField({ label, unit, value, onChange, step = "1", placeholder }: NumberFieldProps) {
  return (
    <label>
      <span>
        {label} {unit ? <small>{unit}</small> : null}
      </span>
      <input
        inputMode={step === "1" ? "numeric" : "decimal"}
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

export function ExerciseForm({ exercise, exercises, onDone }: ExerciseFormProps) {
  const nameId = useId();
  const mergeId = useId();
  const { pending, run: runAction } = useActionFeedback();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(exercise?.name ?? "");
  const [defaultIsometric, setDefaultIsometric] = useState(exercise?.defaultIsometric ?? false);
  const [setCount, setSetCount] = useState(toDraft(exercise?.defaultSetCount));
  const [reps, setReps] = useState(toDraft(exercise?.defaultReps));
  const [holdSeconds, setHoldSeconds] = useState(toDraft(exercise?.defaultHoldSeconds));
  const [weightKg, setWeightKg] = useState(toDraft(exercise?.defaultWeightKg));
  const [durationMinutes, setDurationMinutes] = useState(toDraft(exercise?.defaultDurationMinutes));
  const [distanceKm, setDistanceKm] = useState(toDraft(exercise?.defaultDistanceKm));
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");

  const mergeTargets = exercises.filter((item) => item.id !== exercise?.id);
  const mergeTarget = mergeTargets.find((item) => item.id === mergeTargetId);

  function run(action: () => Promise<ExerciseActionResult>, success: string) {
    runAction(action, {
      success,
      fallbackError: "No se pudo guardar.",
      onSuccess: onDone,
      onError: (message) => setError(message || null),
    });
  }

  function save() {
    run(() =>
      saveExerciseAction(exercise?.id ?? null, {
        name,
        defaultIsometric,
        defaultSetCount: setCount,
        defaultReps: reps,
        defaultHoldSeconds: holdSeconds,
        defaultWeightKg: weightKg,
        defaultDurationMinutes: durationMinutes,
        defaultDistanceKm: distanceKm,
      }),
      "Ejercicio guardado",
    );
  }

  return (
    <div className="rr-exercise-form">
      {error ? (
        <p className="rr-exercise-incomplete" role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}

      <label className="rr-exercise-form-name" htmlFor={nameId}>
        <span>Nombre</span>
        <input
          data-autofocus={!exercise || undefined}
          id={nameId}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Sentadilla búlgara"
          required
          type="text"
          value={name}
        />
      </label>
      {exercise ? (
        <p className="rr-exercise-form-hint">Cambiar el nombre no modifica las sesiones ya registradas.</p>
      ) : null}

      <label className="rr-exercise-isometric">
        <input
          checked={defaultIsometric}
          onChange={(event) => setDefaultIsometric(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong>Isométrico por defecto</strong>
          <small>Al registrarlo, la casilla Isométrico aparecerá marcada</small>
        </span>
      </label>

      <fieldset className="rr-exercise-form-defaults">
        <legend>Valores por defecto <small>opcionales</small></legend>
        <div>
          <NumberField label="Series" onChange={setSetCount} placeholder="3" value={setCount} />
          {defaultIsometric ? (
            <NumberField label="Segundos" onChange={setHoldSeconds} placeholder="45" value={holdSeconds} />
          ) : null}
          <NumberField label="Repeticiones" onChange={setReps} placeholder={defaultIsometric ? "—" : "12"} value={reps} />
          <NumberField label="Peso" onChange={setWeightKg} placeholder="0" step="0.5" unit="kg" value={weightKg} />
          <NumberField label="Duración" onChange={setDurationMinutes} placeholder="10" step="0.5" unit="min" value={durationMinutes} />
          <NumberField label="Distancia" onChange={setDistanceKm} placeholder="2" step="0.1" unit="km" value={distanceKm} />
        </div>
      </fieldset>

      <div className="rr-exercise-form-actions">
        {exercise ? (
          <button
            className="rr-modal-secondary"
            disabled={pending}
            onClick={() =>
              run(
                () => setExerciseArchivedAction(exercise.id, !exercise.archivedAt),
                exercise.archivedAt ? "Ejercicio reactivado" : "Ejercicio archivado",
              )
            }
            type="button"
          >
            {exercise.archivedAt ? "Reactivar" : "Archivar"}
          </button>
        ) : (
          <span />
        )}
        <button className="rr-modal-primary" disabled={pending} onClick={save} type="button">
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {exercise && mergeTargets.length > 0 ? (
        <section className="rr-exercise-merge">
          {showMerge ? (
            <>
              <h3>Fusionar con otro ejercicio</h3>
              <p>
                Las sesiones de &ldquo;{exercise.name}&rdquo; pasarán al ejercicio que elijas y este se eliminará.
                El historial conserva los nombres registrados.
              </p>
              <label htmlFor={mergeId}>
                <span>Fusionar en</span>
                <select
                  id={mergeId}
                  onChange={(event) => setMergeTargetId(event.target.value)}
                  value={mergeTargetId}
                >
                  <option value="">Elige un ejercicio</option>
                  {mergeTargets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.archivedAt ? " (archivado)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {mergeTarget ? (
                <p className="rr-exercise-merge-summary" role="status">
                  Se moverán {exercise.sessionCount} sesi{exercise.sessionCount === 1 ? "ón" : "ones"} a
                  &ldquo;{mergeTarget.name}&rdquo;, que conserva su nombre y valores por defecto.
                </p>
              ) : null}
              <div className="rr-exercise-form-actions">
                <button className="rr-modal-secondary" onClick={() => setShowMerge(false)} type="button">
                  Cancelar
                </button>
                <button
                  className="rr-modal-secondary is-danger"
                  disabled={!mergeTarget || pending}
                  onClick={() => run(() => mergeExercisesAction(exercise.id, mergeTargetId), "Ejercicios fusionados")}
                  type="button"
                >
                  Fusionar y eliminar
                </button>
              </div>
            </>
          ) : (
            <button className="rr-exercise-disclosure" onClick={() => setShowMerge(true)} type="button">
              Fusionar con otro ejercicio…
            </button>
          )}
        </section>
      ) : null}
    </div>
  );
}
