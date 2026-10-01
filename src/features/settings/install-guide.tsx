"use client";

import { useSyncExternalStore } from "react";

type InstallState = "installed" | "ios" | "other";

function readInstallState(): InstallState {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  // iPadOS reports itself as a Mac; touch support tells them apart.
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

const subscribe = () => () => {};

// How to add the app to the home screen. On iOS, notifications only work once it is installed.
export function InstallGuide() {
  const state = useSyncExternalStore<InstallState | null>(subscribe, readInstallState, () => null);

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
