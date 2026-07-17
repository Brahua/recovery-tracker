import {
  historyTimeFormatter,
  reboundLabels,
} from "@/features/history/history-formatters";
import type { NightlyCloseout } from "@/types/recovery";

export function HistoryCloseoutCard({ closeout }: { closeout: NightlyCloseout }) {
  return (
    <section className="rr-history-closeout">
      <header>
        <span aria-hidden="true">☾</span>
        <strong>Cierre del día</strong>
        <time dateTime={closeout.createdAt}>
          {historyTimeFormatter.format(new Date(closeout.createdAt))}
        </time>
      </header>
      <div className="rr-history-closeout-chips">
        <span>Dolor final {closeout.endOfDayPain}/10</span>
        <span>Rebote {reboundLabels[closeout.reboundPainLevel].toLocaleLowerCase("es-PE")}</span>
        <span>Energía {closeout.energy}/5</span>
        <span>Sueño {closeout.sleepHours} h · calidad {closeout.sleepQuality}/5</span>
      </div>
      {closeout.notes && <p>{closeout.notes}</p>}
    </section>
  );
}
