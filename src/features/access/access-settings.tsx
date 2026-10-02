"use client";

import { useId, useState } from "react";

import { useToast } from "@/components/feedback/toast-provider";
import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { ModalSheet } from "@/components/modal-sheet";
import {
  inviteEmailAction,
  removeInviteAction,
  setAccessModeAction,
} from "@/features/access/actions";
import { buildInviteMessage, type AccessOverview } from "@/lib/access";

type Confirmation = { kind: "remove"; email: string } | { kind: "mode" } | null;

// Ajustes → Acceso, only rendered for the admin (the database checks the role again).
export function AccessSettings({ overview }: { overview: AccessOverview }) {
  const toast = useToast();
  const { pending, run } = useActionFeedback();
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const isOpen = overview.mode === "open";

  function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    run(() => inviteEmailAction(email), {
      success: (result) =>
        result.added === false ? "Ese correo ya estaba invitado" : "Invitación agregada",
      fallbackError: "No se pudo agregar la invitación.",
      onSuccess: () => setEmail(""),
      onError: (message) => setError(message || null),
    });
  }

  // navigator.share needs a direct tap, so sharing is its own button rather than a step of invite.
  async function share(invitedEmail: string) {
    const text = buildInviteMessage(invitedEmail, window.location.origin);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Invitación copiada");
    } catch (shareError) {
      // Closing the share sheet is not an error.
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      toast.error("No se pudo compartir. Copia el enlace de la app y envíalo tú.");
    }
  }

  function closeConfirmation() {
    setConfirmation(null);
    setConfirmError(null);
  }

  function confirm() {
    if (!confirmation) return;
    const action =
      confirmation.kind === "remove"
        ? () => removeInviteAction(confirmation.email)
        : () => setAccessModeAction(isOpen ? "invite_only" : "open");
    run(action, {
      success:
        confirmation.kind === "remove"
          ? "Invitación quitada"
          : isOpen
            ? "Acceso solo por invitación"
            : "Acceso abierto a cualquier cuenta de Google",
      fallbackError: "No se pudo guardar el cambio.",
      onSuccess: closeConfirmation,
      onError: (message) => setConfirmError(message || null),
    });
  }

  return (
    <div className="rr-access">
      <div className="rr-access-mode">
        <p className="rr-settings-status">
          <span className={isOpen ? "rr-access-badge is-open" : "rr-access-badge"}>
            {isOpen ? "Abierto" : "Solo por invitación"}
          </span>
        </p>
        <p className="rr-settings-hint">
          {isOpen
            ? "Cualquier persona con una cuenta de Google puede crear su cuenta. La lista de invitados se guarda, pero no se usa."
            : "Solo pueden crear su cuenta los correos de esta lista. Quien ya tiene cuenta sigue entrando."}
        </p>
        <button
          className="rr-button rr-button--secondary rr-access-mode-toggle"
          onClick={() => setConfirmation({ kind: "mode" })}
          type="button"
        >
          {isOpen ? "Volver a solo por invitación" : "Abrir a cualquier cuenta de Google"}
        </button>
      </div>

      <form className="rr-settings-form rr-access-invite" noValidate onSubmit={invite}>
        <label htmlFor={inputId}>Invitar a alguien</label>
        <input
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={error ? true : undefined}
          autoCapitalize="none"
          autoComplete="email"
          id={inputId}
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nombre@gmail.com"
          spellCheck={false}
          type="email"
          value={email}
        />
        <p className="rr-settings-hint" id={hintId}>
          El correo de la cuenta de Google con la que va a entrar. Después compártele la invitación.
        </p>
        {error ? (
          <p className="rr-settings-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <button className="rr-modal-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : "Invitar"}
        </button>
      </form>

      <section aria-labelledby={`${inputId}-list`} className="rr-access-list">
        <h3 id={`${inputId}-list`}>Invitados ({overview.invites.length})</h3>
        {overview.invites.length === 0 ? (
          <p className="rr-settings-hint">Todavía no invitaste a nadie.</p>
        ) : (
          <ul>
            {overview.invites.map((invite) => (
              <li key={invite.email}>
                <div className="rr-access-row-copy">
                  <strong>{invite.email}</strong>
                  <span className={invite.joined ? "rr-access-state is-joined" : "rr-access-state"}>
                    {invite.joined ? "Ya entró" : "Pendiente"}
                  </span>
                </div>
                <div className="rr-access-row-actions">
                  {invite.joined ? null : (
                    <button
                      aria-label={`Compartir invitación con ${invite.email}`}
                      className="rr-modal-secondary"
                      onClick={() => share(invite.email)}
                      type="button"
                    >
                      Compartir
                    </button>
                  )}
                  <button
                    aria-label={`Quitar a ${invite.email}`}
                    className="rr-modal-secondary is-danger"
                    onClick={() => setConfirmation({ kind: "remove", email: invite.email })}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalSheet
        footer={
          <>
            <button
              className="rr-modal-secondary"
              data-autofocus
              onClick={closeConfirmation}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={
                confirmation?.kind === "remove"
                  ? "rr-modal-secondary is-danger"
                  : "rr-modal-primary"
              }
              disabled={pending}
              onClick={confirm}
              type="button"
            >
              {pending
                ? "Guardando…"
                : confirmation?.kind === "remove"
                  ? "Quitar"
                  : isOpen
                    ? "Solo por invitación"
                    : "Abrir acceso"}
            </button>
          </>
        }
        onClose={closeConfirmation}
        open={confirmation !== null}
        title={
          confirmation?.kind === "remove"
            ? "¿Quitar la invitación?"
            : isOpen
              ? "¿Volver a solo por invitación?"
              : "¿Abrir el acceso?"
        }
      >
        <div className="rr-delete-record">
          {confirmation?.kind === "remove" ? (
            <>
              <strong>{confirmation.email}</strong>
              <p>
                Si todavía no entró, ya no podrá crear su cuenta. Si ya entró, su cuenta sigue
                activa.
              </p>
            </>
          ) : (
            <p>
              {isOpen
                ? "Solo los correos de tu lista podrán crear una cuenta nueva. Quien ya tiene cuenta sigue entrando."
                : "Cualquier persona con una cuenta de Google podrá crear su cuenta, sin invitación."}
            </p>
          )}
          {confirmError ? (
            <p className="rr-delete-record-error" role="alert">
              {confirmError}
            </p>
          ) : null}
        </div>
      </ModalSheet>
    </div>
  );
}
