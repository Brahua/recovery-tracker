import { describe, expect, it } from "vitest";

import {
  buildMorningSuccessState,
  buildSessionSuccessState,
  resolveSavedSession,
  resolveRegistrarMode,
} from "@/lib/registrar-flow";
import type { DayProgress } from "@/lib/session-goal-progress";
import type { RehabSession } from "@/types/recovery";

const sessions = [{ id: "latest" }, { id: "saved" }] as RehabSession[];

describe("resolveRegistrarMode", () => {
  it("keeps a valid requested mode", () => {
    expect(resolveRegistrarMode("session", false, false)).toBe("session");
    expect(resolveRegistrarMode("morning", false, false)).toBe("morning");
  });

  it("sends old closeout links to the morning check-in", () => {
    expect(resolveRegistrarMode("closeout", true, false)).toBe("morning");
  });

  it("defaults to session while today's session goal is not met", () => {
    expect(resolveRegistrarMode(undefined, false, false)).toBe("session");
  });

  it("defaults to the morning check-in once the goal is met and it is missing", () => {
    expect(resolveRegistrarMode(undefined, true, false)).toBe("morning");
  });

  it("falls back to session when both are done", () => {
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

describe("buildMorningSuccessState", () => {
  it("sends to the session when today has none yet", () => {
    const state = buildMorningSuccessState(false, "Listo. Amaneciste bastante bien.");

    expect(state.title).toBe("Que tengas buen día.");
    expect(state.body).toBe("Listo. Amaneciste bastante bien.");
    expect(state.primaryHref).toBe("/registrar?mode=session");
    expect(state.primaryLabel).toBe("Empezar sesión");
  });

  it("goes back to Hoy when today already has sessions", () => {
    const state = buildMorningSuccessState(true);

    expect(state.primaryHref).toBe("/");
    expect(state.secondaryHref).toBe("/insights");
  });
});
