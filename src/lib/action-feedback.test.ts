import { describe, expect, it } from "vitest";

import {
  resolveActionOutcome,
  resolveThrownOutcome,
  unexpectedErrorMessage,
} from "@/lib/action-feedback";

describe("resolveActionOutcome", () => {
  it("treats ok results as success", () => {
    expect(resolveActionOutcome({ ok: true }, "fallback")).toEqual({ kind: "success" });
  });

  it("keeps action errors inline", () => {
    expect(resolveActionOutcome({ ok: false, error: "Nombre requerido" }, "fallback")).toEqual({
      kind: "invalid",
      message: "Nombre requerido",
    });
  });

  it("uses the fallback when the action gives no message", () => {
    expect(resolveActionOutcome({ ok: false }, "fallback")).toEqual({
      kind: "invalid",
      message: "fallback",
    });
  });

  it("supports the { error } shape used by check-in forms", () => {
    expect(resolveActionOutcome({ error: "Fecha futura" }, "fallback")).toEqual({
      kind: "invalid",
      message: "Fecha futura",
    });
    expect(resolveActionOutcome({ error: null }, "fallback")).toEqual({ kind: "success" });
  });
});

describe("resolveThrownOutcome", () => {
  it("maps thrown errors to the connection message", () => {
    expect(resolveThrownOutcome(new Error("fetch failed"))).toEqual({
      kind: "unexpected",
      message: unexpectedErrorMessage,
    });
  });

  it("rethrows Next.js redirect signals", () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/;307;",
    });
    expect(() => resolveThrownOutcome(redirect)).toThrow(redirect);
  });
});
