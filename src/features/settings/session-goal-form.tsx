"use client";

import { useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { saveSessionGoalAction } from "@/features/settings/actions";
import { SessionGoalFields } from "@/features/settings/session-goal-fields";
import type { SessionGoal } from "@/lib/session-goal";

export function SessionGoalForm({ goal }: { goal: SessionGoal }) {
  const { pending, run } = useActionFeedback();
  const [draft, setDraft] = useState(goal);
  const [error, setError] = useState<string | null>(null);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    run(() => saveSessionGoalAction(draft), {
      success: "Meta guardada",
      fallbackError: "No se pudo guardar la meta.",
      onError: (message) => setError(message || null),
    });
  }

  return (
    <form className="rr-condition-form" noValidate onSubmit={save}>
      <SessionGoalFields disabled={pending} goal={draft} onChange={setDraft} />
      <p className="rr-settings-hint">
        Un día queda completo con esas sesiones, y la semana con esos días. Si cambias la meta, las
        semanas anteriores se miran con la meta nueva.
      </p>
      {error ? (
        <p className="rr-settings-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="rr-condition-actions">
        <button className="rr-modal-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : "Guardar meta"}
        </button>
      </div>
    </form>
  );
}
