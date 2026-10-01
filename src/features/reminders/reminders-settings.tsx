"use client";

import { useEffect, useId, useState } from "react";

import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import {
  registerPushSubscriptionAction,
  saveReminderSettingsAction,
  sendTestNotificationAction,
  unregisterPushSubscriptionAction,
} from "@/features/reminders/actions";
import { urlBase64ToUint8Array } from "@/lib/push/vapid-key";
import { readBrowserInstallState } from "@/lib/pwa/install-state";
import { reminderLabels } from "@/lib/reminders/settings";
import type { ReminderKind, ReminderSettings } from "@/types/reminders";

type DeviceState =
  | "checking"
  | "unsupported"
  | "needs-install"
  | "not-configured"
  | "denied"
  | "off"
  | "on";

interface RemindersSettingsProps {
  settings: ReminderSettings;
  /** NEXT_PUBLIC_VAPID_PUBLIC_KEY, or null while the server has no keys. */
  vapidPublicKey: string | null;
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

function detectDeviceState(vapidPublicKey: string | null): Promise<DeviceState> | DeviceState {
  if (readBrowserInstallState() === "ios") return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (!vapidPublicKey) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  return currentSubscription().then((subscription) => (subscription ? "on" : "off"));
}

const deviceMessages: Record<Exclude<DeviceState, "checking" | "off" | "on">, string> = {
  unsupported: "Este navegador no permite notificaciones. En el iPhone, ábrela desde el ícono de la pantalla de inicio.",
  "needs-install": "En el iPhone, las notificaciones solo funcionan con la app instalada. Agrégala a la pantalla de inicio (sección de arriba) y ábrela desde el ícono.",
  "not-configured": "Las notificaciones todavía no están configuradas en el servidor.",
  denied: "Las notificaciones están bloqueadas. Actívalas en Ajustes del iPhone → Notificaciones → Recovery y vuelve aquí.",
};

export function RemindersSettings({ settings, vapidPublicKey }: RemindersSettingsProps) {
  const { pending, run } = useActionFeedback();
  const [device, setDevice] = useState<DeviceState>("checking");
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  useEffect(() => {
    // Browser-only APIs (service worker, Notification) are read after mount.
    let cancelled = false;
    Promise.resolve()
      .then(() => detectDeviceState(vapidPublicKey))
      .then(
        (state) => !cancelled && setDevice(state),
        () => !cancelled && setDevice("unsupported"),
      );
    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  function enableOnThisDevice() {
    setError(null);
    run(
      async () => {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setDevice(permission === "denied" ? "denied" : "off");
          return { ok: false, error: "Sin permiso no podemos avisarte. Puedes volver a intentarlo cuando quieras." };
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey ?? ""),
          }));
        return registerPushSubscriptionAction(subscription.toJSON());
      },
      {
        success: "Notificaciones activadas en este dispositivo",
        fallbackError: "No se pudieron activar las notificaciones.",
        onSuccess: () => setDevice("on"),
        onError: (message) => setError(message || null),
      },
    );
  }

  function disableOnThisDevice() {
    setError(null);
    run(
      async () => {
        const subscription = await currentSubscription();
        if (!subscription) return { ok: true };
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        return unregisterPushSubscriptionAction(endpoint);
      },
      {
        success: "Notificaciones desactivadas en este dispositivo",
        fallbackError: "No se pudieron desactivar.",
        onSuccess: () => setDevice("off"),
        onError: (message) => setError(message || null),
      },
    );
  }

  function sendTest() {
    setError(null);
    run(sendTestNotificationAction, {
      success: "Notificación de prueba enviada",
      fallbackError: "No se pudo enviar la prueba.",
      onError: (message) => setError(message || null),
    });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    run(
      () =>
        saveReminderSettingsAction({
          sessionEnabled: draft.sessionEnabled,
          sessionTime: draft.sessionTime,
          closeoutEnabled: draft.closeoutEnabled,
          closeoutTime: draft.closeoutTime,
        }),
      {
        success: "Recordatorios guardados",
        fallbackError: "No se pudieron guardar los recordatorios.",
        onError: (message) => setError(message || null),
      },
    );
  }

  return (
    <div className="rr-reminders">
      <div className="rr-reminders-device" aria-live="polite">
        {device === "checking" ? <p className="rr-settings-hint">Revisando este dispositivo…</p> : null}
        {device === "on" ? (
          <>
            <p className="rr-settings-status is-ok">
              <span aria-hidden="true">✓</span> Notificaciones activas en este dispositivo.
            </p>
            <div className="rr-reminders-actions">
              <button className="rr-modal-primary" disabled={pending} onClick={sendTest} type="button">
                Enviar notificación de prueba
              </button>
              <button className="rr-modal-secondary" disabled={pending} onClick={disableOnThisDevice} type="button">
                Desactivar en este dispositivo
              </button>
            </div>
          </>
        ) : null}
        {device === "off" ? (
          <>
            <p className="rr-settings-hint">Este dispositivo todavía no recibe recordatorios.</p>
            <button className="rr-modal-primary" disabled={pending} onClick={enableOnThisDevice} type="button">
              Activar notificaciones en este dispositivo
            </button>
          </>
        ) : null}
        {device in deviceMessages ? (
          <p className="rr-settings-hint">{deviceMessages[device as keyof typeof deviceMessages]}</p>
        ) : null}
      </div>

      <form className="rr-reminders-form" noValidate onSubmit={save}>
        {(["session", "closeout"] as ReminderKind[]).map((kind) => (
          <ReminderRow
            enabled={kind === "session" ? draft.sessionEnabled : draft.closeoutEnabled}
            key={kind}
            kind={kind}
            onEnabledChange={(enabled) =>
              setDraft((current) =>
                kind === "session" ? { ...current, sessionEnabled: enabled } : { ...current, closeoutEnabled: enabled },
              )
            }
            onTimeChange={(time) =>
              setDraft((current) =>
                kind === "session" ? { ...current, sessionTime: time } : { ...current, closeoutTime: time },
              )
            }
            time={kind === "session" ? draft.sessionTime : draft.closeoutTime}
          />
        ))}
        <p className="rr-settings-hint">
          Solo te avisamos si todavía no lo registraste ese día. Hora de Lima.
        </p>
        {error ? (
          <p className="rr-settings-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <button className="rr-modal-primary" disabled={pending} type="submit">
          {pending ? "Guardando…" : "Guardar recordatorios"}
        </button>
      </form>
    </div>
  );
}

interface ReminderRowProps {
  kind: ReminderKind;
  enabled: boolean;
  time: string;
  onEnabledChange: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
}

const reminderDescriptions: Record<ReminderKind, string> = {
  session: "Si a esta hora no registraste ninguna sesión.",
  closeout: "Si a esta hora no hiciste el cierre del día.",
};

function ReminderRow({ kind, enabled, time, onEnabledChange, onTimeChange }: ReminderRowProps) {
  const switchId = useId();
  const timeId = useId();
  const descriptionId = useId();

  return (
    <div className={`rr-reminder-row ${enabled ? "is-enabled" : ""}`}>
      <div>
        <label htmlFor={switchId}>{reminderLabels[kind]}</label>
        <p id={descriptionId}>{reminderDescriptions[kind]}</p>
      </div>
      <input
        aria-describedby={descriptionId}
        checked={enabled}
        className="rr-switch"
        id={switchId}
        onChange={(event) => onEnabledChange(event.target.checked)}
        role="switch"
        type="checkbox"
      />
      <label className="rr-visually-hidden" htmlFor={timeId}>
        Hora del recordatorio de {reminderLabels[kind].toLowerCase()}
      </label>
      <input
        className="rr-reminder-time"
        disabled={!enabled}
        id={timeId}
        onChange={(event) => onTimeChange(event.target.value)}
        required
        step={300}
        type="time"
        value={time}
      />
    </div>
  );
}
