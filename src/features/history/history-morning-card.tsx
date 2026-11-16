import Link from "@/components/app-link";

import {
  formatHistoryNumber,
  reboundLabels,
  sleepQualityLabels,
  stiffnessLabels,
} from "@/features/history/history-formatters";
import type { MorningCheckin } from "@/types/recovery";

// Deleting happens from the edit screen, after a confirmation, like every other record.
export function HistoryMorningCard({ checkin }: { checkin: MorningCheckin }) {
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
      <Link
        aria-label="Editar registro de la mañana"
        className="rr-history-edit"
        href={`/registrar/manana/${checkin.id}`}
      >
        Editar
      </Link>
    </section>
  );
}
