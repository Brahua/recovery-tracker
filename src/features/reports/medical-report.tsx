import Link from "next/link";

import { ReportActions } from "@/components/report-actions";
import { ReportQuestions } from "@/components/report-questions";
import { buildPainTrendInsight } from "@/lib/recovery-insights";
import { createReportViewModel } from "@/lib/report-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const shortDateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function formatDate(value: string, style: "short" | "long" = "short") {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return (style === "long" ? longDateFormatter : shortDateFormatter).format(date);
}

function formatNumber(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 })
        .format(value)
        .replace(".", ",")
    : "--";
}

function painPolyline(points: Array<{ pain: number }>) {
  const width = 520;
  const height = 100;
  if (points.length === 0) return "";

  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? width : (index / (points.length - 1)) * width;
    const y = height - Math.min(1, point.pain / 6) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  if (points.length === 1) coordinates.unshift(`0,${coordinates[0]!.split(",")[1]}`);
  return coordinates.join(" ");
}

function ReportCard({
  children,
  number,
  title,
}: {
  children: React.ReactNode;
  number: string;
  title: string;
}) {
  return (
    <article className="rr-report-card">
      <header><span>{number}</span><h2>{title}</h2></header>
      {children}
    </article>
  );
}

interface MedicalReportProps {
  now: string;
  recentSessions: RehabSession[];
  recentCloseouts: NightlyCloseout[];
  windowDays: 7 | 14 | 30;
}

export function MedicalReport({
  now,
  recentSessions,
  recentCloseouts,
  windowDays,
}: MedicalReportProps) {
  const report = createReportViewModel(
    recentSessions,
    recentCloseouts,
    windowDays,
    now,
  );
  const { summary } = report;
  const line = painPolyline(summary.painTrend.points);
  const hasData = report.recordCount > 0 || report.sessionCount > 0;
  const ranges = [
    { days: 30, href: "/reporte", label: "30 dias" },
    { days: 14, href: "/reporte?range=14", label: "2 semanas" },
    { days: 7, href: "/reporte?range=7", label: "7 dias" },
  ] as const;

  return (
    <div className="rr-report">
      <header className="rr-report-header">
        <Link aria-label="Volver a Hoy" className="rr-report-back" href="/">‹</Link>
        <div>
          <p>{formatDate(summary.dateRange.from, "long")} al {formatDate(summary.dateRange.to, "long")}</p>
          <h1>Reporte</h1>
        </div>
        <span className={`rr-report-status ${hasData ? "" : "is-empty"}`}>{hasData ? "Listo" : "Sin datos"}</span>
        <nav aria-label="Rango del reporte" className="rr-report-ranges">
          {ranges.map((range) => (
            <Link
              aria-current={windowDays === range.days ? "page" : undefined}
              className={windowDays === range.days ? "is-active" : ""}
              href={range.href}
              key={range.days}
            >
              {range.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="rr-report-main">
        <section aria-label="Resumen del reporte" className="rr-report-summary">
          <div><span>Dolor medio</span><strong>{formatNumber(summary.averagePain)}<small>/10</small></strong></div>
          <div><span>Registros</span><strong>{report.recordCount}<small>/{windowDays} dias</small></strong></div>
          <div><span>Sesiones</span><strong>{report.sessionCount}<small>hechas</small></strong></div>
        </section>

        <section className="rr-report-grid">
          <ReportCard number="01" title="Evolucion del dolor">
            {line ? (
              <div className="rr-report-pain-chart">
                <svg aria-label="Evolucion del dolor" preserveAspectRatio="none" role="img" viewBox="0 0 520 100">
                  <defs><linearGradient id="rr-report-pain-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--rr-accent)" stopOpacity="0.32" /><stop offset="1" stopColor="var(--rr-accent)" stopOpacity="0" /></linearGradient></defs>
                  <polygon fill="url(#rr-report-pain-area)" points={`0,100 ${line} 520,100`} />
                  <polyline fill="none" points={line} />
                </svg>
              </div>
            ) : <p className="rr-report-empty">Aun no hay cierres en este rango.</p>}
            <p className="rr-report-copy">{buildPainTrendInsight(summary.painTrend)}</p>
            <div className="rr-high-pain-days">
              <h3>Dias con dolor alto (6 o mas)</h3>
              {summary.highPainDays.length > 0 ? summary.highPainDays.map((day) => (
                <div key={day.date}><strong>{day.pain}</strong><span>{formatDate(day.date, "long")}</span><small>Dolor de cierre registrado</small></div>
              )) : <p>No aparecen dias de 6/10 o mas.</p>}
            </div>
          </ReportCard>

          <ReportCard number="02" title="Respuesta a las sesiones">
            <div className="rr-report-stats">
              <div><strong>{report.improvedSessionCount}/{report.sessionCount}</strong><span>terminan mejor que antes</span></div>
              <div><strong>{formatNumber(report.averageSessionPainDelta)}</strong><span>cambio medio de dolor</span></div>
            </div>
            <p className="rr-report-copy">{summary.sessionResponseText}</p>
          </ReportCard>

          <ReportCard number="03" title="Rebote y asociaciones">
            <p className="rr-report-copy">{summary.reboundAssociationText}</p>
          </ReportCard>

          <ReportCard number="04" title="Sueno y energia">
            <div className="rr-report-stats">
              <div><strong>{formatNumber(report.averageSleepHours)} h</strong><span>sueno medio</span></div>
              <div><strong>{formatNumber(report.averageEnergy)}/5</strong><span>energia media al cierre</span></div>
            </div>
            <p className="rr-report-copy">{summary.sleepEnergyText}</p>
          </ReportCard>

          <ReportCard number="05" title="Notas destacadas">
            <div className="rr-report-notes">
              {report.notes.length > 0 ? report.notes.map((note, index) => (
                <blockquote key={`${note.date}-${index}`}><p>“{note.text}”</p><cite>{formatDate(note.date, "long")} · {note.source}</cite></blockquote>
              )) : <p className="rr-report-empty">No hay notas destacadas en este rango.</p>}
            </div>
          </ReportCard>

          <ReportCard number="06" title="Preguntas para tu cita">
            <ReportQuestions questions={summary.appointmentQuestions} />
          </ReportCard>
        </section>
      </div>
      <ReportActions />
    </div>
  );
}
