import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const weekdayFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "2-digit",
  month: "short",
});

const sessionTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const closeoutDateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

const reboundLabels: Record<NightlyCloseout["reboundPainLevel"], string> = {
  NONE: "Sin rebote",
  MILD: "Leve",
  MODERATE: "Moderado",
  STRONG: "Fuerte",
};

const sessionTypeLabels: Record<RehabSession["sessionType"], string> = {
  HOME: "Casa",
  PHYSIOTHERAPY: "Fisioterapia",
  HYDROTHERAPY: "Hidroterapia",
  GYM: "Gym",
  WALK: "Caminata",
  OTHER: "Otro",
};

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeSessionDateKey(value: RehabSession["occurredAt"]) {
  return value.slice(0, 10);
}

function formatWeekday(value: Date) {
  const formatted = weekdayFormatter.format(value);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatSessionMoment(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return sessionTimeFormatter.format(date);
}

function formatCloseoutDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return closeoutDateFormatter.format(date);
}

function buildLoggedDayKeys(
  recentSessions: RehabSession[],
  recentCloseouts: NightlyCloseout[],
) {
  const keys = new Set<string>();

  for (const session of recentSessions) {
    keys.add(normalizeSessionDateKey(session.occurredAt));
  }

  for (const closeout of recentCloseouts) {
    keys.add(closeout.date);
  }

  return keys;
}

function calculateLoggingStreak(
  recentSessions: RehabSession[],
  recentCloseouts: NightlyCloseout[],
) {
  const loggedDayKeys = buildLoggedDayKeys(recentSessions, recentCloseouts);
  let streak = 0;
  const cursor = new Date();

  while (loggedDayKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildTodayStatus(
  recentSessions: RehabSession[],
  recentCloseouts: NightlyCloseout[],
) {
  const todayKey = toDateKey(new Date());
  const hasSessionToday = recentSessions.some(
    (session) => normalizeSessionDateKey(session.occurredAt) === todayKey,
  );
  const hasCloseoutToday = recentCloseouts.some(
    (closeout) => closeout.date === todayKey,
  );

  if (!hasSessionToday) {
    return {
      eyebrow: "Siguiente paso",
      title: "Toca registrar la sesion de hoy.",
      body: "Deja la respuesta inmediata de la rodilla antes de que se mezcle con el resto del dia.",
      primaryHref: "#post-therapy",
      primaryLabel: "Registrar sesion",
      secondaryHref: "#nightly-closeout",
      secondaryLabel: "Ver cierre nocturno",
      progressLabel: "0 de 2 rituales de hoy listos",
    };
  }

  if (!hasCloseoutToday) {
    return {
      eyebrow: "Buen avance",
      title: "La sesion ya esta guardada; falta cerrar el dia.",
      body: "Cuando termine la noche, registra dolor final, energia, sueno y si aparecio rebote.",
      primaryHref: "#nightly-closeout",
      primaryLabel: "Registrar cierre nocturno",
      secondaryHref: "#post-therapy",
      secondaryLabel: "Revisar sesion",
      progressLabel: "1 de 2 rituales de hoy listo",
    };
  }

  return {
    eyebrow: "Dia completo",
    title: "Los dos rituales de hoy ya quedaron guardados.",
    body: "Puedes revisar el estado reciente o volver a registrar algo si hubo un cambio mas tarde.",
    primaryHref: "#recent-status",
    primaryLabel: "Revisar estado reciente",
    secondaryHref: "#post-therapy",
    secondaryLabel: "Abrir sesion",
    progressLabel: "2 de 2 rituales de hoy listos",
  };
}

interface TodayOverviewProps {
  recentSessions: RehabSession[];
  recentCloseouts: NightlyCloseout[];
}

export function TodayOverview({
  recentSessions,
  recentCloseouts,
}: TodayOverviewProps) {
  const today = new Date();
  const latestSession = recentSessions[0];
  const latestCloseout = recentCloseouts[0];
  const streak = calculateLoggingStreak(recentSessions, recentCloseouts);
  const todayStatus = buildTodayStatus(recentSessions, recentCloseouts);

  return (
    <section className="today-grid grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="hero-panel overflow-hidden rounded-[30px] border border-[#dfe5d8] bg-[linear-gradient(135deg,#17331f_0%,#2f5a3c_54%,#9cc37d_100%)] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              {todayStatus.eyebrow}
            </p>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/85">
              Hoy · {formatWeekday(today)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-white/65">
              Consistencia
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
              {streak} dia{streak === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm text-white/70">racha de registro</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
              {todayStatus.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              {todayStatus.body}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#18311f] transition hover:bg-[#eff7ec]"
                href={todayStatus.primaryHref}
              >
                {todayStatus.primaryLabel}
              </a>
              <a
                className="rounded-2xl border border-white/22 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
                href={todayStatus.secondaryHref}
              >
                {todayStatus.secondaryLabel}
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                Ritual de hoy
              </p>
              <p className="mt-2 text-lg font-semibold">{todayStatus.progressLabel}</p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                La app premia constancia y observacion, no mas carga ni mas tolerancia al dolor.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                  Dolor reciente
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {latestSession ? `${latestSession.painAfter}/10` : "--"}
                </p>
                <p className="mt-2 text-sm text-white/72">
                  {latestSession
                    ? `Ultima sesion: ${formatSessionMoment(latestSession.occurredAt)}`
                    : "Todavia no hay sesiones registradas."}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                  Cierre reciente
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {latestCloseout ? `${latestCloseout.endOfDayPain}/10` : "--"}
                </p>
                <p className="mt-2 text-sm text-white/72">
                  {latestCloseout
                    ? `Ultimo cierre: ${formatCloseoutDate(latestCloseout.date)}`
                    : "Todavia no hay cierres guardados."}
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>

      <aside
        className="section-card soft-panel grid gap-4 rounded-[30px] border p-6 sm:p-8"
        id="recent-status"
      >
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
            Estado reciente
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117]">
            Vista rapida de hoy
          </h2>
          <p className="text-sm leading-7 text-[#526154]">
            Una lectura compacta para saber que ya registraste y como vienen dolor,
            carga, sueno y rebote.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <article className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
              Ultima sesion
            </p>
            {latestSession ? (
              <div className="mt-3 grid gap-2 text-sm text-[#263b29]">
                <p className="font-semibold text-[#18201a]">
                  {formatSessionMoment(latestSession.occurredAt)}
                </p>
                <p>Tipo: {sessionTypeLabels[latestSession.sessionType]}</p>
                <p>Dolor despues: {latestSession.painAfter}/10</p>
                <p>Carga: {latestSession.perceivedLoad}/5</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#5d6b5f]">
                Aun no hay una sesion para resumir.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#5d6b5f]">
              Ultimo cierre
            </p>
            {latestCloseout ? (
              <div className="mt-3 grid gap-2 text-sm text-[#263b29]">
                <p className="font-semibold text-[#18201a]">
                  {formatCloseoutDate(latestCloseout.date)}
                </p>
                <p>Dolor final: {latestCloseout.endOfDayPain}/10</p>
                <p>Sueno: {latestCloseout.sleepHours} h</p>
                <p>Rebote: {reboundLabels[latestCloseout.reboundPainLevel]}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#5d6b5f]">
                Aun no hay un cierre para resumir.
              </p>
            )}
          </article>
        </div>
      </aside>
    </section>
  );
}
