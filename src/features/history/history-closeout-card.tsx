import Link from "@/components/app-link";
import { historyTimeFormatter, reboundLabels } from "@/features/history/history-formatters";
import type { NightlyCloseout } from "@/types/recovery";

export function HistoryCloseoutCard({ closeout }: { closeout: NightlyCloseout }) {
  return (
    <section className="rr-history-closeout" data-closeout-id={closeout.id}>
      <header>
        <span aria-hidden="true">☾</span>
        <div>
          <strong>Cierre del día</strong>
          <time dateTime={closeout.createdAt}>
            {historyTimeFormatter.format(new Date(closeout.createdAt))}
          </time>
        </div>
      </header>
      <div className="rr-history-closeout-chips">
        <span>Dolor final {closeout.endOfDayPain}/10</span>
        <span>Rebote {reboundLabels[closeout.reboundPainLevel].toLocaleLowerCase("es-PE")}</span>
        <span>Energía {closeout.energy}/5</span>
        <span>
          Sueño {closeout.sleepHours} h · calidad {closeout.sleepQuality}/5
        </span>
      </div>
      {closeout.notes && <p>{closeout.notes}</p>}
      <Link
        aria-label="Editar cierre del día"
        className="rr-history-edit"
        href={`/registrar/cierre/${closeout.id}`}
      >
        Editar
      </Link>
    </section>
  );
}
