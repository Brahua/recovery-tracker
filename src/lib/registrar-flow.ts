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

export function resolveSavedSession(
  sessions: RehabSession[],
  savedSessionId?: string,
) {
  return savedSessionId
    ? sessions.find((session) => session.id === savedSessionId)
    : sessions[0];
}

export function resolveSavedCloseout(
  closeouts: NightlyCloseout[],
  savedCloseoutId?: string,
) {
  return savedCloseoutId
    ? closeouts.find((closeout) => closeout.id === savedCloseoutId)
    : closeouts[0];
}

export function resolveRegistrarMode(
  requestedMode: string | undefined,
  hasSessionToday: boolean,
  hasCloseoutToday: boolean,
): RegistrarMode {
  if (requestedMode === "session" || requestedMode === "closeout") {
    return requestedMode;
  }

  if (!hasSessionToday) {
    return "session";
  }

  if (!hasCloseoutToday) {
    return "closeout";
  }

  return "session";
}

export function buildSessionSuccessState(
  hasCloseoutToday: boolean,
  summary?: string,
): RitualSuccessConfig {
  return {
    eyebrow: "Sesion guardada",
    title: hasCloseoutToday
      ? "La sesion ya quedo registrada y el dia va completo."
      : "Buen avance. Ahora falta cerrar el dia.",
    body:
      summary ??
      (hasCloseoutToday
        ? "Tu registro ya entra en el seguimiento de hoy. Puedes revisar patrones o volver a Hoy."
        : "La respuesta post-terapia ya esta guardada. Cuando termine el dia, completa el cierre nocturno."),
    primaryHref: "/",
    primaryLabel: "Volver a Hoy",
    secondaryHref: hasCloseoutToday ? "/insights" : "/registrar?mode=closeout",
    secondaryLabel: hasCloseoutToday ? "Ver insights" : "Hacer el cierre ahora",
  };
}

export function buildCloseoutSuccessState(
  hasSessionToday: boolean,
  summary?: string,
): RitualSuccessConfig {
  return {
    eyebrow: "Cierre guardado",
    title: hasSessionToday ? "Dia cerrado." : "Cierre guardado.",
    body:
      summary ??
      (hasSessionToday
        ? "No queda nada pendiente. Hoy tambien cuidaste tu rodilla."
        : "El cierre nocturno quedo registrado. Falta la sesion para completar el dia."),
    primaryHref: hasSessionToday ? "/" : "/registrar?mode=session",
    primaryLabel: hasSessionToday ? "Hasta manana" : "Registrar sesion",
    secondaryHref: "/insights",
    secondaryLabel: "Ver mi progreso",
  };
}
