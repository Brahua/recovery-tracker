"use client";

import { useSyncExternalStore } from "react";

import { readBrowserInstallState, type InstallState } from "@/lib/pwa/install-state";

const subscribe = () => () => {};

// How to add the app to the home screen. On iOS, notifications only work once it is installed.
export function InstallGuide() {
  const state = useSyncExternalStore<InstallState | null>(subscribe, readBrowserInstallState, () => null);

  if (state === null) return null;

  if (state === "installed") {
    return (
      <p className="rr-settings-status is-ok">
        <span aria-hidden="true">✓</span> La app está instalada en este dispositivo.
      </p>
    );
  }

  if (state === "ios") {
    return (
      <ol className="rr-settings-steps">
        <li>
          Abre <strong>recovery-tracker.brahua.com</strong> en <strong>Safari</strong>.
        </li>
        <li>
          Toca <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).
        </li>
        <li>
          Elige <strong>Agregar a inicio</strong> y confirma con <strong>Agregar</strong>.
        </li>
        <li>Abre la app desde el ícono nuevo. Las notificaciones solo funcionan así.</li>
      </ol>
    );
  }

  return (
    <p className="rr-settings-hint">
      En el celular, abre la app en el navegador y usa <strong>Agregar a inicio</strong> o{" "}
      <strong>Instalar app</strong> desde su menú. En un iPhone, hazlo desde Safari.
    </p>
  );
}
