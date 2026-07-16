import { describe, expect, it } from "vitest";

import {
  buildCloseoutSuccessState,
  buildSessionSuccessState,
  resolveRegistrarMode,
} from "@/lib/registrar-flow";

describe("resolveRegistrarMode", () => {
  it("keeps a valid requested mode", () => {
    expect(resolveRegistrarMode("session", false, false)).toBe("session");
    expect(resolveRegistrarMode("closeout", true, false)).toBe("closeout");
  });

  it("defaults to session when today's session is missing", () => {
    expect(resolveRegistrarMode(undefined, false, false)).toBe("session");
  });

  it("defaults to closeout when session exists but closeout is missing", () => {
    expect(resolveRegistrarMode(undefined, true, false)).toBe("closeout");
  });

  it("falls back to session when both rituals are already done", () => {
    expect(resolveRegistrarMode(undefined, true, true)).toBe("session");
  });
});

describe("buildSessionSuccessState", () => {
  it("returns to today and keeps closeout as the secondary action", () => {
    const state = buildSessionSuccessState(false);

    expect(state.primaryHref).toBe("/");
    expect(state.primaryLabel).toBe("Volver a Hoy");
    expect(state.secondaryHref).toBe("/registrar?mode=closeout");
    expect(state.secondaryLabel).toBe("Hacer el cierre ahora");
  });

  it("offers insights when both rituals are done", () => {
    const state = buildSessionSuccessState(true, "Resumen");

    expect(state.body).toBe("Resumen");
    expect(state.primaryHref).toBe("/");
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
