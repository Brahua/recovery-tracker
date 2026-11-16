import type { DayProgress } from "@/lib/session-goal-progress";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

export type RegistrarMode = "session" | "closeout";

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

export function resolveSavedCloseout(closeouts: NightlyCloseout[], savedCloseoutId?: string) {
  return savedCloseoutId
    ? closeouts.find((closeout) => closeout.id === savedCloseoutId)
    : closeouts[0];
}

export function resolveRegistrarMode(
  requestedMode: string | undefined,
  dayGoalMet: boolean,
  hasCloseoutToday: boolean,
): RegistrarMode {
  if (requestedMode === "session" || requestedMode === "closeout") {
    return requestedMode;
  }

  if (!dayGoalMet) {
    return "session";
  }

  if (!hasCloseoutToday) {
    return "closeout";
  }

  return "session";
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

/** Success after saving a closeout; the day is "closed" only when the session goal is met. */
export function buildCloseoutSuccessState(
  dayGoalMet: boolean,
  summary?: string,
  areaPhrase?: string,
): RitualSuccessConfig {
  return {
    eyebrow: "Cierre guardado",
    title: dayGoalMet ? "Dia cerrado." : "Cierre guardado.",
    body:
      summary ??
      (dayGoalMet
        ? `No queda nada pendiente. Hoy también cuidaste ${areaPhrase ?? "tu recuperación"}.`
        : "El cierre nocturno quedo registrado. Aún te faltan sesiones para completar el día."),
    primaryHref: dayGoalMet ? "/" : "/registrar?mode=session",
    primaryLabel: dayGoalMet ? "Hasta manana" : "Registrar sesion",
    secondaryHref: "/insights",
    secondaryLabel: "Ver mi progreso",
  };
}
