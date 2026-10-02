"use client";

import { useId, useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { achieveGoalAction, addGoalAction, removeGoalAction } from "@/features/goals/actions";
import { canAddGoal, goalLimitMessage, splitGoals } from "@/lib/goals";
import { GOAL_TITLE_MAX_LENGTH } from "@/lib/validation/goals";
import type { RecoveryGoal } from "@/types/goals";

// "Mis metas" in Hoy: goals in the patient's own words, marked as achieved when they are.
export function GoalsCard({ goals }: { goals: RecoveryGoal[] }) {
  const { pending, run } = useActionFeedback();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const { pending: open, achieved } = splitGoals(goals);
  const canAdd = canAddGoal(open.length);

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(() => addGoalAction(title), {
      success: "Meta agregada",
      fallbackError: "No se pudo agregar la meta.",
      onSuccess: () => setTitle(""),
      onError: (message) => setError(message || null),
    });
  }

  function achieve(goal: RecoveryGoal) {
    run(() => achieveGoalAction(goal.id), {
      success: "¡Meta lograda! Un paso más.",
      fallbackError: "No se pudo marcar la meta.",
      onError: (message) => setError(message || null),
    });
  }

  function remove(goal: RecoveryGoal) {
    run(() => removeGoalAction(goal.id), {
      success: "Meta quitada",
      fallbackError: "No se pudo quitar la meta.",
      onError: (message) => setError(message || null),
    });
  }

  return (
    <section aria-labelledby="rr-goals-title" className="rr-goals-card">
      <div className="rr-goals-heading">
        <h2 id="rr-goals-title">Mis metas</h2>
        {achieved.length > 0 ? (
          <span>
            {achieved.length} lograda{achieved.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {open.length > 0 ? (
        <ul className="rr-goals-list">
          {open.map((goal) => (
            <li key={goal.id}>
              <button
                aria-label={`Marcar como lograda: ${goal.title}`}
                className="rr-goal-check"
                disabled={pending}
                onClick={() => achieve(goal)}
                type="button"
              />
              <span>{goal.title}</span>
              <button
                aria-label={`Quitar meta: ${goal.title}`}
                className="rr-goal-remove"
                disabled={pending}
                onClick={() => remove(goal)}
                type="button"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rr-goals-empty">
          Escribe lo que quieres volver a hacer, por ejemplo «subir escaleras sin dolor».
        </p>
      )}

      {canAdd ? (
        <form className="rr-goals-form" noValidate onSubmit={add}>
          <label className="rr-visually-hidden" htmlFor={inputId}>
            Nueva meta
          </label>
          <input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            id={inputId}
            maxLength={GOAL_TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Una meta nueva"
            type="text"
            value={title}
          />
          <button className="rr-button rr-button--secondary" disabled={pending} type="submit">
            Agregar
          </button>
        </form>
      ) : (
        <p className="rr-goals-empty">{goalLimitMessage}</p>
      )}

      {error ? (
        <p className="rr-goals-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      {achieved.length > 0 ? (
        <details className="rr-goals-achieved">
          <summary>Metas logradas</summary>
          <ul className="rr-goals-list">
            {achieved.map((goal) => (
              <li className="is-achieved" key={goal.id}>
                <span aria-hidden="true" className="rr-goal-done">
                  ✓
                </span>
                <span>{goal.title}</span>
                <button
                  aria-label={`Quitar meta: ${goal.title}`}
                  className="rr-goal-remove"
                  disabled={pending}
                  onClick={() => remove(goal)}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
