"use client";

import { useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { ConditionFields } from "@/features/settings/condition-fields";
import { saveConditionAction } from "@/features/settings/actions";
import type { Condition } from "@/lib/condition";
import {
  conditionInputFromDraft,
  draftFromCondition,
  emptyConditionDraft,
} from "@/lib/condition-draft";

export function ConditionForm({ condition }: { condition: Condition | null }) {
  const { pending, run } = useActionFeedback();
  const [draft, setDraft] = useState(() => draftFromCondition(condition));
  const [error, setError] = useState<string | null>(null);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    run(() => saveConditionAction(conditionInputFromDraft(draft)), {
      success: "Recuperación guardada",
      fallbackError: "No se pudo guardar.",
      onError: (message) => setError(message || null),
    });
  }

  function remove() {
    setError(null);
    run(() => saveConditionAction(null), {
      success: "Quitamos tu lesión",
      fallbackError: "No se pudo quitar.",
      onSuccess: () => setDraft({ ...emptyConditionDraft }),
      onError: (message) => setError(message || null),
    });
  }

  return (
    <form className="rr-condition-form" noValidate onSubmit={save}>
      <ConditionFields disabled={pending} draft={draft} onChange={setDraft} />
      <p className="rr-settings-hint">
        Con esto la app te habla de tu zona y el Reporte dice qué estás tratando. Solo hay una
        lesión activa.
      </p>
      {error ? (
        <p className="rr-settings-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="rr-condition-actions">
        <button className="rr-modal-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {condition ? (
          <button
            className="rr-button rr-button--secondary"
            disabled={pending}
            onClick={remove}
            type="button"
          >
            Quitar
          </button>
        ) : null}
      </div>
    </form>
  );
}
