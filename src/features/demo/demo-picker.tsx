"use client";

import { useState } from "react";

import { FormPendingReporter } from "@/components/feedback/form-pending-reporter";
import { ModalSheet } from "@/components/modal-sheet";
import { enterDemoAction } from "@/features/demo/actions";
import { demoProfileIds, demoProfiles } from "@/lib/demo/profiles";

// Landing button + modal: pick a demo patient and enter the app as them.
export function DemoPicker({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="rr-landing-demo"
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
      >
        Modo demo <span aria-hidden="true">→</span>
      </button>

      <ModalSheet onClose={() => setOpen(false)} open={open} title="Modo demo">
        <p className="rr-demo-intro">
          Elige un paciente y recorre la app con semanas de registros ya cargados: sesiones,
          cierres, historial, insights y reporte.
        </p>
        <ul className="rr-demo-list">
          {demoProfileIds.map((id) => {
            const profile = demoProfiles[id];
            return (
              <li key={id}>
                <form action={enterDemoAction}>
                  <FormPendingReporter />
                  <input name="profile" type="hidden" value={id} />
                  <button className="rr-demo-card" type="submit">
                    <span className="rr-demo-card-title">{profile.title}</span>
                    <span className="rr-demo-card-injury">{profile.injury}</span>
                    <span className="rr-demo-card-summary">{profile.summary}</span>
                    <span aria-hidden="true" className="rr-demo-card-go">
                      Entrar →
                    </span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
        <p className="rr-demo-note">
          Son datos de ejemplo y cualquiera puede entrar y modificarlos: no escribas información
          personal. La demo se restablece cada cierto tiempo.
        </p>
      </ModalSheet>
    </>
  );
}
