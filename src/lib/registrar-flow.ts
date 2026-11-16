import type { DayProgress } from "@/lib/session-goal-progress";
import type { RehabSession } from "@/types/recovery";

export type RegistrarMode = "session" | "morning";

export interface RitualSuccessConfig {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function resolveSavedSession(sessions: RehabSession[], savedSessionId?: string) {
  return savedSessionId ? sessions.find((session) => session.id === savedSessionId) : sessions[0];
}

export function resolveRegistrarMode(
  requestedMode: string | undefined,
  dayGoalMet: boolean,
  hasCheckinToday: boolean,
): RegistrarMode {
  if (requestedMode === "session" || requestedMode === "morning") {
    return requestedMode;
  }

  // Old links (reminders, bookmarks) still ask for the nightly closeout: it became the morning.
  if (requestedMode === "closeout") {
    return "morning";
  }

  if (!dayGoalMet) {
    return "session";
  }

  return hasCheckinToday ? "session" : "morning";
}

/** Success after saving a session, worded against today's session goal. */
export function buildSessionSuccessState(day: DayProgress, summary?: string): RitualSuccessConfig {
  const missing = Math.max(0, day.perDay - day.count);
  return {
    eyebrow: "Sesion guardada",
    title: day.met ? "Día completo." : `Llevas ${day.count} de ${day.perDay} sesiones hoy.`,
    body:
      summary ??
      (day.met
        ? "Tu registro ya entra en el seguimiento de hoy. Puedes revisar patrones o volver a Hoy."
        : `Te ${missing === 1 ? "falta 1 sesión" : `faltan ${missing} sesiones`} para completar el día.`),
    primaryHref: "/",
    primaryLabel: "Volver a Hoy",
    secondaryHref: day.met ? "/insights" : "/registrar?mode=session",
    secondaryLabel: day.met ? "Ver insights" : "Registrar otra sesión",
  };
}

/** Success after "¿Cómo amaneciste?": back to the day, or straight to the session. */
export function buildMorningSuccessState(
  hasSessionToday: boolean,
  summary?: string,
): RitualSuccessConfig {
  return {
    eyebrow: "Mañana guardada",
    title: "Que tengas buen día.",
    body: summary ?? "Listo. Tu mañana quedó registrada.",
    primaryHref: hasSessionToday ? "/" : "/registrar?mode=session",
    primaryLabel: hasSessionToday ? "Volver a Hoy" : "Empezar sesión",
    secondaryHref: hasSessionToday ? "/insights" : "/",
    secondaryLabel: hasSessionToday ? "Ver insights" : "Volver a Hoy",
  };
}
