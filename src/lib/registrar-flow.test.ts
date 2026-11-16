import { describe, expect, it } from "vitest";

import {
  buildCloseoutSuccessState,
  buildSessionSuccessState,
  resolveSavedCloseout,
  resolveSavedSession,
  resolveRegistrarMode,
} from "@/lib/registrar-flow";
import type { DayProgress } from "@/lib/session-goal-progress";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

const sessions = [{ id: "latest" }, { id: "saved" }] as RehabSession[];
const closeouts = [{ id: "latest" }, { id: "saved" }] as NightlyCloseout[];

describe("resolveRegistrarMode", () => {
  it("keeps a valid requested mode", () => {
    expect(resolveRegistrarMode("session", false, false)).toBe("session");
    expect(resolveRegistrarMode("closeout", true, false)).toBe("closeout");
  });

  it("defaults to session while today's session goal is not met", () => {
    expect(resolveRegistrarMode(undefined, false, false)).toBe("session");
  });

  it("defaults to the optional closeout once the goal is met", () => {
    expect(resolveRegistrarMode(undefined, true, false)).toBe("closeout");
  });

  it("falls back to session when both rituals are already done", () => {
    expect(resolveRegistrarMode(undefined, true, true)).toBe("session");
  });
});

describe("resolveSavedSession", () => {
  it("selects the session identified by the save redirect", () => {
    expect(resolveSavedSession(sessions, "saved")?.id).toBe("saved");
  });

  it("keeps backward-compatible latest-session behavior without an id", () => {
    expect(resolveSavedSession(sessions, undefined)?.id).toBe("latest");
  });
});

describe("resolveSavedCloseout", () => {
  it("selects the closeout identified by the save redirect", () => {
    expect(resolveSavedCloseout(closeouts, "saved")?.id).toBe("saved");
  });

  it("keeps backward-compatible latest-closeout behavior without an id", () => {
    expect(resolveSavedCloseout(closeouts, undefined)?.id).toBe("latest");
  });
});

const progress = (count: number, perDay: number): DayProgress => ({
  date: "2026-07-16",
  count,
  perDay,
  met: count >= perDay,
  status: count >= perDay ? "full" : count > 0 ? "partial" : "empty",
});

describe("buildSessionSuccessState", () => {
  it("asks for another session while the day goal is not met", () => {
    const state = buildSessionSuccessState(progress(1, 2));

    expect(state.title).toBe("Llevas 1 de 2 sesiones hoy.");
    expect(state.body).toBe("Te falta 1 sesión para completar el día.");
    expect(state.primaryHref).toBe("/");
    expect(state.primaryLabel).toBe("Volver a Hoy");
    expect(state.secondaryHref).toBe("/registrar?mode=session");
    expect(state.secondaryLabel).toBe("Registrar otra sesión");
  });

  it("completes the day without a closeout and offers insights", () => {
    const state = buildSessionSuccessState(progress(1, 1), "Resumen");

    expect(state.title).toBe("Día completo.");
    expect(state.body).toBe("Resumen");
    expect(state.secondaryHref).toBe("/insights");
  });
});

describe("buildCloseoutSuccessState", () => {
  it("returns home and offers insights after a complete day", () => {
    const state = buildCloseoutSuccessState(true, "Resumen del cierre");

    expect(state.title).toBe("Dia cerrado.");
    expect(state.body).toBe("Resumen del cierre");
    expect(state.primaryHref).toBe("/");
    expect(state.primaryLabel).toBe("Hasta manana");
    expect(state.secondaryHref).toBe("/insights");
    expect(state.secondaryLabel).toBe("Ver mi progreso");
  });

  it("does not describe an incomplete day as closed", () => {
    const state = buildCloseoutSuccessState(false);

    expect(state.title).toBe("Cierre guardado.");
    expect(state.primaryHref).toBe("/registrar?mode=session");
    expect(state.primaryLabel).toBe("Registrar sesion");
    expect(state.secondaryHref).toBe("/insights");
  });
});

describe("buildCloseoutSuccessState with a condition", () => {
  it("names the area of the injury once the day is closed", () => {
    expect(buildCloseoutSuccessState(true, undefined, "tu rodilla derecha").body).toBe(
      "No queda nada pendiente. Hoy también cuidaste tu rodilla derecha.",
    );
    expect(buildCloseoutSuccessState(true).body).toBe(
      "No queda nada pendiente. Hoy también cuidaste tu recuperación.",
    );
  });
});
