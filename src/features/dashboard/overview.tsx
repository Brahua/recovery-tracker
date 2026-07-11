import {
  calculatePainTrend,
  calculateRecentExerciseFrequency,
  calculateReboundSummary,
  calculateSleepPainComparison,
  calculateWeeklyLoad,
} from "@/lib/recovery-calculations";
import {
  buildPainTrendInsight,
  buildReboundInsight,
  buildSleepPainInsight,
  buildWeeklyLoadInsight,
  buildWeeklyRecoveryStory,
} from "@/lib/recovery-insights";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const shortDateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return shortDateFormatter.format(date);
}

function PainTrendChart({
  points,
}: {
  points: Array<{ date: string; pain: number }>;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cdd8c8] bg-white/70 p-5 text-sm leading-7 text-[#5d6b5f]">
        Todavia no hay cierres suficientes para dibujar la tendencia.
      </div>
    );
  }

  const width = 320;
  const height = 132;
  const padding = 16;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const pointPath = points
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (point.pain / 10) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[24px] border border-[#dfe5d8] bg-white p-4">
      <svg
        aria-label="Grafico de tendencia de dolor"
        className="h-[132px] w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 5, 10].map((value) => {
          const y = height - padding - (value / 10) * (height - padding * 2);
          return (
            <g key={value}>
              <line
                stroke="#dbe5d4"
                strokeDasharray="3 5"
                strokeWidth="1"
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
              />
              <text
                fill="#6a7f6f"
                fontSize="10"
                textAnchor="end"
                x={padding - 4}
                y={y + 3}
              >
                {value}
              </text>
            </g>
          );
        })}
        <path
          d={pointPath}
          fill="none"
          stroke="#244b30"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {points.map((point, index) => {
          const x = padding + index * stepX;
          const y = height - padding - (point.pain / 10) * (height - padding * 2);

          return (
            <g key={point.date}>
              <circle cx={x} cy={y} fill="#9cc37d" r="4.5" stroke="#244b30" strokeWidth="2" />
              <text
                fill="#5d6b5f"
                fontSize="10"
                textAnchor="middle"
                x={x}
                y={height - 2}
              >
                {formatDateLabel(point.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WeeklyLoadBars({
  sessions,
}: {
  sessions: RehabSession[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cdd8c8] bg-white/70 p-5 text-sm leading-7 text-[#5d6b5f]">
        Aun no hay sesiones de esta semana para visualizar la carga.
      </div>
    );
  }

  const totals = new Map<string, number>();

  for (const session of sessions) {
    const date = session.occurredAt.slice(0, 10);
    totals.set(date, (totals.get(date) ?? 0) + session.perceivedLoad);
  }

  const maxValue = Math.max(...totals.values(), 1);
  const entries = [...totals.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <div className="grid gap-3">
      {entries.map(([date, total]) => (
        <div className="grid gap-1" key={date}>
          <div className="flex items-center justify-between text-sm text-[#445546]">
            <span>{formatDateLabel(date)}</span>
            <span>{total} pts</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e6ede1]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#264f31_0%,#89b66d_100%)]"
              style={{ width: `${(total / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseFrequencyBars({
  items,
}: {
  items: Array<{ name: string; count: number }>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cdd8c8] bg-white/70 p-5 text-sm leading-7 text-[#5d6b5f]">
        Aun no hay ejercicios suficientes para detectar repeticiones utiles.
      </div>
    );
  }

  const topItems = items.slice(0, 5);
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <div className="grid gap-3">
      {topItems.map((item) => (
        <div className="grid gap-1" key={item.name}>
          <div className="flex items-center justify-between gap-4 text-sm text-[#263b29]">
            <span className="truncate">{item.name}</span>
            <span>{item.count}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e6ede1]">
            <div
              className="h-full rounded-full bg-[#587f4a]"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardCard({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <article className="section-card soft-panel rounded-[28px] border border-[#dfe5d8] p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
          {eyebrow}
        </p>
        <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117]">
          {title}
        </h3>
        <p className="text-sm leading-7 text-[#526154]">{body}</p>
      </div>
      <div className="mt-6">{children}</div>
    </article>
  );
}

interface RecoveryDashboardProps {
  recentSessions: RehabSession[];
  recentCloseouts: NightlyCloseout[];
}

export function RecoveryDashboard({
  recentSessions,
  recentCloseouts,
}: RecoveryDashboardProps) {
  const pain7 = calculatePainTrend(recentCloseouts, 7);
  const pain14 = calculatePainTrend(recentCloseouts, 14);
  const pain30 = calculatePainTrend(recentCloseouts, 30);
  const weeklySessions = recentSessions.filter((session) => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return session.occurredAt.slice(0, 10) >= date.toISOString().slice(0, 10);
  });
  const weeklyLoad = calculateWeeklyLoad(recentSessions, 7);
  const rebound = calculateReboundSummary(recentSessions, recentCloseouts, 7);
  const sleepPain = calculateSleepPainComparison(recentCloseouts, 14);
  const exercises = calculateRecentExerciseFrequency(recentSessions, 30);
  const weeklyStory = buildWeeklyRecoveryStory({
    painTrend: pain7,
    weeklyLoad,
    rebound,
    sleepPain,
  });

  return (
    <section className="dashboard-grid grid gap-6" id="dashboard">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
          Dashboard
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#162117] sm:text-4xl">
          Patrones recientes sin ruido clinico.
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-[#526154] sm:text-base">
          Este bloque responde las preguntas practicas del MVP: si el dolor cambia,
          cuanta carga hubo, si aparece rebote, como se cruza el sueno con el dolor
          y que ejercicios se repiten mas.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardCard
          body={buildPainTrendInsight(pain7)}
          eyebrow="Dolor"
          title="Tendencia de dolor de cierre"
        >
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "7 dias", summary: pain7 },
                { label: "14 dias", summary: pain14 },
                { label: "30 dias", summary: pain30 },
              ].map(({ label, summary }) => (
                <div
                  className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4"
                  key={label}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#18201a]">
                    {summary.averagePain ?? "--"}
                  </p>
                  <p className="mt-1 text-sm text-[#526154]">
                    {summary.direction === "DOWN"
                      ? "Bajando"
                      : summary.direction === "UP"
                        ? "Subiendo"
                        : summary.direction === "STABLE"
                          ? "Estable"
                          : "Sin datos"}
                  </p>
                </div>
              ))}
            </div>
            <PainTrendChart points={pain30.points} />
          </div>
        </DashboardCard>

        <DashboardCard
          body="Una lectura corta que junta dolor, carga, rebote y sueno sin convertir esto en una conclusion medica."
          eyebrow="Historia semanal"
          title="Resumen observacional"
        >
          <div className="rounded-[24px] border border-[#d8e1d3] bg-[linear-gradient(180deg,#f3f7ef_0%,#ffffff_100%)] p-5 text-sm leading-7 text-[#263b29]">
            {weeklyStory}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          body={buildWeeklyLoadInsight(weeklyLoad)}
          eyebrow="Carga"
          title="Carga semanal"
        >
          <div className="mb-4 flex items-end justify-between gap-4 rounded-2xl bg-[#f7f8f3] p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
                Total 7 dias
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#18201a]">
                {weeklyLoad.totalLoad}
              </p>
            </div>
            <p className="text-sm text-[#526154]">
              {weeklyLoad.sessionCount} sesion{weeklyLoad.sessionCount === 1 ? "" : "es"}
            </p>
          </div>
          <WeeklyLoadBars sessions={weeklySessions} />
        </DashboardCard>

        <DashboardCard
          body={buildSleepPainInsight(sleepPain)}
          eyebrow="Sueno vs dolor"
          title="Relacion reciente"
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
                Menos de 6 h
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#18201a]">
                {sleepPain.lowSleepPainAverage ?? "--"}
              </p>
              <p className="mt-1 text-sm text-[#526154]">
                dolor final promedio
              </p>
            </div>
            <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
                6 h o mas
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#18201a]">
                {sleepPain.adequateSleepPainAverage ?? "--"}
              </p>
              <p className="mt-1 text-sm text-[#526154]">
                dolor final promedio
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          body={buildReboundInsight(rebound)}
          eyebrow="Rebote"
          title="Despues de la sesion"
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
                Sesiones observadas
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#18201a]">
                {rebound.sessionCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
                Cierres con rebote
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#18201a]">
                {rebound.reboundCount}
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          body="La idea no es premiar intensidad, sino ver que se repite para luego contrastarlo con carga y rebote."
          eyebrow="Ejercicios"
          title="Mas frecuentes"
        >
          <ExerciseFrequencyBars items={exercises} />
        </DashboardCard>
      </div>
    </section>
  );
}
