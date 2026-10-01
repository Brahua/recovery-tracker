"use client";

import { useId, useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { saveDisplayNameAction } from "@/features/settings/actions";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

interface ProfileFormProps {
  chosenName: string | null;
  fallbackName: string | null;
}

export function ProfileForm({ chosenName, fallbackName }: ProfileFormProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const { pending, run } = useActionFeedback();
  const [name, setName] = useState(chosenName ?? "");
  const [error, setError] = useState<string | null>(null);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    run(() => saveDisplayNameAction(name), {
      success: name.trim() ? "Nombre guardado" : "Usaremos el nombre de tu cuenta",
      fallbackError: "No se pudo guardar tu nombre.",
      onError: (message) => setError(message || null),
    });
  }

  return (
    <form className="rr-settings-form" noValidate onSubmit={save}>
      <label htmlFor={inputId}>¿Cómo quieres que te llamemos?</label>
      <input
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={error ? true : undefined}
        autoComplete="nickname"
        id={inputId}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        onChange={(event) => setName(event.target.value)}
        placeholder={fallbackName ?? "Tu nombre"}
        type="text"
        value={name}
      />
      <p className="rr-settings-hint" id={hintId}>
        Aparece en el saludo de Hoy y en la barra lateral. Déjalo vacío para usar el nombre de tu cuenta de Google.
      </p>
      {error ? (
        <p className="rr-settings-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <button className="rr-modal-primary" disabled={pending} type="submit">
        {pending ? "Guardando…" : "Guardar nombre"}
      </button>
    </form>
  );
}
