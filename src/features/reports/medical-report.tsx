import { createMedicalReportSummary } from "@/lib/recovery-insights";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const rangeDateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return rangeDateFormatter.format(date);
}

function ReportWindowCard({
  windowDays,
  sessions,
  closeouts,
}: {
  windowDays: number;
  sessions: RehabSession[];
  closeouts: NightlyCloseout[];
}) {
  const summary = createMedicalReportSummary(sessions, closeouts, windowDays);

  return (
    <article className="section-card soft-panel rounded-[28px] border border-[#dfe5d8] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
            Ventana {windowDays} dias
          </p>
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117]">
            Reporte para consulta
          </h3>
          <p className="text-sm leading-7 text-[#526154]">
            {formatDateLabel(summary.dateRange.from)} al {formatDateLabel(summary.dateRange.to)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Dolor promedio
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#18201a]">
            {summary.averagePain ?? "--"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Tendencia de dolor
          </p>
          <p className="mt-2 text-sm leading-7 text-[#263b29]">
            {summary.painTrend.direction === "DOWN"
              ? "Bajando"
              : summary.painTrend.direction === "UP"
                ? "Subiendo"
                : summary.painTrend.direction === "STABLE"
                  ? "Estable"
                  : "Sin datos"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[#526154]">
            {summary.painTrend.sampleCount > 0
              ? `Promedio ${summary.averagePain}/10 con delta ${summary.painTrend.delta ?? 0}.`
              : "Todavia no hay suficientes cierres para una lectura de tendencia."}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Dias de dolor alto
          </p>
          {summary.highPainDays.length === 0 ? (
            <p className="mt-2 text-sm leading-7 text-[#526154]">
              No aparecen dias de 6/10 o mas en esta ventana.
            </p>
          ) : (
            <div className="mt-2 grid gap-2 text-sm text-[#263b29]">
              {summary.highPainDays.map((day) => (
                <p key={day.date}>
                  {formatDateLabel(day.date)}: {day.pain}/10
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="rounded-2xl border border-[#dfe5d8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Respuesta post-terapia
          </p>
          <p className="mt-2 text-sm leading-7 text-[#263b29]">
            {summary.sessionResponseText}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dfe5d8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Rebote y ejercicios
          </p>
          <p className="mt-2 text-sm leading-7 text-[#263b29]">
            {summary.reboundAssociationText}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dfe5d8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Sueno y energia
          </p>
          <p className="mt-2 text-sm leading-7 text-[#263b29]">
            {summary.sleepEnergyText}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Notas utiles
          </p>
          {summary.noteHighlights.length === 0 ? (
            <p className="mt-2 text-sm leading-7 text-[#526154]">
              No hay notas breves destacables en esta ventana.
            </p>
          ) : (
            <div className="mt-2 grid gap-2 text-sm text-[#263b29]">
              {summary.noteHighlights.map((note, index) => (
                <p key={`${windowDays}-${index}`}>{note}</p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
            Preguntas para doctor o fisio
          </p>
          <div className="mt-2 grid gap-2 text-sm text-[#263b29]">
            {summary.appointmentQuestions.map((question, index) => (
              <p key={`${windowDays}-question-${index}`}>{index + 1}. {question}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

interface MedicalReportProps {
  recentSessions: RehabSession[];
  recentCloseouts: NightlyCloseout[];
}

export function MedicalReport({
  recentSessions,
  recentCloseouts,
}: MedicalReportProps) {
  return (
    <section className="report-grid grid gap-6" id="medical-report">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
          Reporte medico
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#162117] sm:text-4xl">
          Evidencia breve para consulta.
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-[#526154] sm:text-base">
          Este reporte resume tendencia, dolor alto, respuesta a sesiones, rebote,
          sueno, energia y preguntas de seguimiento sin convertir el resultado en
          una recomendacion clinica.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportWindowCard
          closeouts={recentCloseouts}
          sessions={recentSessions}
          windowDays={7}
        />
        <ReportWindowCard
          closeouts={recentCloseouts}
          sessions={recentSessions}
          windowDays={30}
        />
      </div>
    </section>
  );
}
