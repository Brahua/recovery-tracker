import Link from "next/link";

import {
  calculatePainTrend,
  calculateRecentExerciseFrequency,
  calculateReboundSummary,
  calculateSleepPainComparison,
  filterCloseoutsByRange,
  filterSessionsByRange,
  getDateRangeForLastDays,
  type PainTrendPoint,
} from "@/lib/recovery-calculations";
import {
  buildPainTrendInsight,
  buildReboundInsight,
  buildSleepPainInsight,
} from "@/lib/recovery-insights";
import {
  buildFourWeekSessionCounts,
  buildReboundDistribution,
} from "@/lib/insights-view-model";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

type InsightsRange = "four-weeks" | "all";

function formatNumber(value?: number) {
  return typeof value === "number"
    ? new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value)
    : "--";
}

function buildPolyline(
  values: number[],
  width: number,
  height: number,
  minimum: number,
  maximum: number,
) {
  if (values.length === 1) {
    const normalized = Math.min(
      1,
      Math.max(0, (values[0]! - minimum) / (maximum - minimum)),
    );
    const y = (height - normalized * height).toFixed(1);
    return `0,${y} ${width},${y}`;
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const normalized = Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
      const y = height - normalized * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return <div className="rr-insights-empty">{children}</div>;
}

function PainChart({ points }: { points: PainTrendPoint[] }) {
  if (points.length === 0) {
    return <EmptyChart>Registra cierres nocturnos para ver la tendencia.</EmptyChart>;
  }

  const width = 920;
  const height = 130;
  const polyline = buildPolyline(points.map((point) => point.pain), width, height, 0, 6);
  const area = `0,${height} ${polyline} ${width},${height}`;
  const lastPoint = polyline.split(" ").at(-1)?.split(",") ?? [width, height];

  return (
    <div className="rr-pain-chart">
      <svg aria-label="Tendencia del dolor medio" preserveAspectRatio="none" role="img" viewBox="0 0 920 130">
        <defs>
          <linearGradient id="rr-pain-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--rr-accent)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--rr-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#rr-pain-area)" points={area} />
        <polyline className="rr-chart-accent-line" fill="none" points={polyline} />
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          fill="var(--rr-ink)"
          r="4.5"
          stroke="var(--rr-accent)"
          strokeWidth="2.5"
        />
      </svg>
      <div className="rr-pain-chart-axis" aria-hidden="true">
        <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span>
      </div>
    </div>
  );
}

function WeeklyLoadChart({ sessions, now }: { sessions: RehabSession[]; now: string }) {
  const weeks = buildFourWeekSessionCounts(sessions, now);
  const maximum = Math.max(...weeks.map((week) => week.count), 1);
  const current = weeks.at(-1)?.count ?? 0;

  return (
    <div>
      <div className="rr-load-bars" aria-label="Sesiones registradas por semana">
        {weeks.map((week, index) => (
          <div key={week.label}>
            <span className={index === weeks.length - 1 ? "is-current" : ""} style={{ height: `${Math.max(5, (week.count / maximum) * 100)}%` }} />
            <small>{week.label}</small>
          </div>
        ))}
      </div>
      <p className="rr-insights-caption">
        <strong>{current} sesion{current === 1 ? "" : "es"}</strong> esta semana
      </p>
    </div>
  );
}

function ReboundChart({ closeouts }: { closeouts: NightlyCloseout[] }) {
  const distribution = buildReboundDistribution(closeouts);

  return (
    <div>
      <div className="rr-rebound-bars">
        {distribution.map((item) => (
          <div key={item.label}>
            <p><span>{item.label}</span><strong>{item.percentage}%</strong></p>
            <span><i className={`is-${item.tone}`} style={{ width: `${item.percentage}%` }} /></span>
          </div>
        ))}
      </div>
      <p className="rr-insights-caption">
        <strong>{distribution[0]?.count ?? 0} de {closeouts.length}</strong> cierres sin rebote
      </p>
    </div>
  );
}

function SleepPainChart({ closeouts }: { closeouts: NightlyCloseout[] }) {
  if (closeouts.length < 2) {
    return <EmptyChart>Se necesitan al menos dos cierres para comparar sueño y dolor.</EmptyChart>;
  }

  const ordered = [...closeouts].sort((left, right) => left.date.localeCompare(right.date));
  const sleepLine = buildPolyline(ordered.map((item) => item.sleepHours), 420, 90, 5, 9);
  const painLine = buildPolyline(ordered.map((item) => item.endOfDayPain), 420, 90, 0, 5);

  return (
    <svg aria-label="Comparacion entre horas de sueño y dolor" className="rr-sleep-chart" preserveAspectRatio="none" role="img" viewBox="0 0 420 90">
      <polyline className="rr-chart-sleep-line" fill="none" points={sleepLine} />
      <polyline className="rr-chart-accent-line" fill="none" points={painLine} />
    </svg>
  );
}

function ExerciseBars({ items }: { items: Array<{ name: string; count: number }> }) {
  if (items.length === 0) {
    return <EmptyChart>Las sesiones registradas todavía no incluyen ejercicios.</EmptyChart>;
  }

  const visible = items.slice(0, 5);
  const maximum = Math.max(...visible.map((item) => item.count), 1);

  return (
    <div className="rr-exercise-frequency">
      {visible.map((item, index) => (
        <div key={item.name}>
          <span title={item.name}>{item.name}</span>
          <i><b className={index === 0 ? "is-leading" : ""} style={{ width: `${(item.count / maximum) * 100}%` }} /></i>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

function InsightCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <article className="rr-insight-card">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

interface RecoveryDashboardProps {
  now: string;
  range: InsightsRange;
  recentSessions: RehabSession[];
  recentCloseouts: NightlyCloseout[];
}

export function RecoveryDashboard({
  now,
  range,
  recentSessions,
  recentCloseouts,
}: RecoveryDashboardProps) {
  const rangeDays = range === "all" ? 36_500 : 28;
  const selectedWindow = getDateRangeForLastDays(rangeDays, now);
  const selectedSessions = filterSessionsByRange(recentSessions, selectedWindow);
  const selectedCloseouts = filterCloseoutsByRange(recentCloseouts, selectedWindow);
  const pain = calculatePainTrend(selectedCloseouts, rangeDays, now);
  const sleepWindow = getDateRangeForLastDays(14, now);
  const sleepCloseouts = filterCloseoutsByRange(selectedCloseouts, sleepWindow);
  const sleepPain = calculateSleepPainComparison(selectedCloseouts, 14, now);
  const exercises = calculateRecentExerciseFrequency(selectedSessions, rangeDays, now);
  const weeklyStory = [
    buildPainTrendInsight(calculatePainTrend(recentCloseouts, 7, now)),
    buildReboundInsight(
      calculateReboundSummary(recentSessions, recentCloseouts, 7, now),
    ),
    buildSleepPainInsight(sleepPain),
  ].join(" ");
  const delta = pain.delta;

  return (
    <div className="rr-insights">
      <header className="rr-insights-header">
        <Link aria-label="Volver a Hoy" className="rr-insights-back" href="/">‹</Link>
        <div>
          <p>{range === "all" ? "Historial completo" : "Ultimas 4 semanas"}</p>
          <h1>Insights</h1>
        </div>
        <nav aria-label="Rango de Insights" className="rr-insights-range">
          <Link aria-current={range === "four-weeks" ? "page" : undefined} className={range === "four-weeks" ? "is-active" : ""} href="/insights">4 sem</Link>
          <Link aria-current={range === "all" ? "page" : undefined} className={range === "all" ? "is-active" : ""} href="/insights?range=all">Todo</Link>
        </nav>
      </header>

      <div className="rr-insights-main">
        <section className="rr-insights-summary">
          <p>Resumen · {range === "all" ? "historial" : "4 semanas"}</p>
          <strong>{weeklyStory}</strong>
        </section>

        <section className="rr-insights-grid">
          <InsightCard title="Dolor medio">
            <div className="rr-pain-metric">
              <strong>{formatNumber(pain.averagePain)}</strong>
              {typeof delta === "number" ? (
                <span className={delta > 0 ? "is-rising" : ""}>
                  {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {formatNumber(Math.abs(delta))} en {range === "all" ? "el historial" : "4 sem"}
                </span>
              ) : null}
            </div>
            <PainChart points={pain.points} />
          </InsightCard>

          <InsightCard title="Carga semanal">
            <WeeklyLoadChart now={now} sessions={recentSessions} />
          </InsightCard>

          <InsightCard title="Rebote">
            <ReboundChart closeouts={selectedCloseouts} />
          </InsightCard>

          <InsightCard title="Sueño y dolor">
            <div className="rr-sleep-legend"><span>● Sueño</span><span>● Dolor</span></div>
            <SleepPainChart closeouts={sleepCloseouts} />
            <p className="rr-insights-caption">{buildSleepPainInsight(sleepPain)}</p>
          </InsightCard>

          <InsightCard title="Ejercicios mas frecuentes">
            <ExerciseBars items={exercises} />
          </InsightCard>
        </section>
      </div>
    </div>
  );
}
