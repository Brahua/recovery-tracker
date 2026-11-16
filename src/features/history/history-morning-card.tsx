"use client";

import Link from "@/components/app-link";
import { useState } from "react";

import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { useActionFeedback } from "@/components/feedback/use-action-feedback";
import { deleteMorningCheckinAction } from "@/features/check-in/morning-checkin/actions";
import {
  formatHistoryDay,
  formatHistoryNumber,
  reboundLabels,
  sleepQualityLabels,
  stiffnessLabels,
} from "@/features/history/history-formatters";
import type { MorningCheckin } from "@/types/recovery";

export function HistoryMorningCard({ checkin }: { checkin: MorningCheckin }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { pending: deletePending, run } = useActionFeedback();

  function deleteCheckin() {
    // The action revalidates Historial, so the card disappears on the refreshed page.
    run(() => deleteMorningCheckinAction(checkin.id), {
      success: "Registro de la mañana eliminado",
      fallbackError: "No se pudo eliminar el registro de la mañana.",
      onSuccess: () => setConfirmDelete(false),
      onError: (message) => setDeleteError(message || null),
    });
  }

  return (
    <section className="rr-history-closeout" data-morning-checkin-id={checkin.id}>
      <header>
        <span aria-hidden="true">☀</span>
        <div>
          <strong>Cómo amaneciste</strong>
        </div>
      </header>
      <div className="rr-history-closeout-chips">
        <span>
          Sueño {formatHistoryNumber(checkin.sleepHours)} h ·{" "}
          {sleepQualityLabels[checkin.sleepQuality]}
        </span>
        <span>Dolor al despertar {checkin.wakingPain}/10</span>
        <span>Rigidez {stiffnessLabels[checkin.stiffnessLevel]}</span>
        {checkin.reboundPainLevel ? (
          <span>
            Rebote de lo de ayer:{" "}
            {reboundLabels[checkin.reboundPainLevel].toLocaleLowerCase("es-PE")}
          </span>
        ) : null}
      </div>
      {checkin.notes && <p>{checkin.notes}</p>}
      <div className="rr-history-record-actions">
        <button
          aria-label="Eliminar registro de la mañana"
          className="rr-history-edit"
          onClick={() => {
            setDeleteError(null);
            setConfirmDelete(true);
          }}
          type="button"
        >
          Eliminar
        </button>
        <Link
          aria-label="Editar registro de la mañana"
          className="rr-history-edit"
          href={`/registrar/manana/${checkin.id}`}
        >
          Editar
        </Link>
      </div>
      <DeleteRecordDialog
        description={`Cómo amaneciste · ${formatHistoryDay(checkin.date)}`}
        error={deleteError}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteCheckin}
        open={confirmDelete}
        pending={deletePending}
        title="¿Eliminar este registro?"
      />
    </section>
  );
}
