import { expect, test } from "@playwright/test";

import {
  addExerciseFromCatalog,
  addQuickExercise,
  closeExerciseDialog,
  exerciseDialog,
  fillSessionBasics,
  openSessionForm,
  sessionExerciseRow,
} from "./exercise-helpers";

test.describe("read-only history", () => {
  test("keeps the current screen visible while history data loads", async ({ page }) => {
    let releaseHistoryRequest = () => {};
    const holdHistoryRequest = new Promise<void>((resolve) => {
      releaseHistoryRequest = resolve;
    });

    await page.route("**/historial**", async (route) => {
      await holdHistoryRequest;
      await route.continue();
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();

    const navigation = page.getByRole("link", { name: "Historial", exact: true }).click();

    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
    await expect(page.getByLabel("Cargando historial")).toHaveCount(0);
    releaseHistoryRequest();
    await navigation;
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
  });

  test("shows a saved session with its individual sets and supports older windows", async ({ page }) => {
    await openSessionForm(page);
    await fillSessionBasics(page);
    await addQuickExercise(page, "Bicicleta 5-10 min");
    await sessionExerciseRow(page, "Bicicleta 5-10 min").click();
    const bicycle = exerciseDialog(page);
    await bicycle.getByLabel(/Duración total/).fill("12.5");
    await bicycle.getByLabel(/Distancia total/).fill("4.2");
    await closeExerciseDialog(page);
    const exercise = await addExerciseFromCatalog(page, "step-u", "Step-up");
    await exercise.getByRole("button", { name: "+ Añadir serie" }).click();
    await exercise.getByLabel("Repeticiones").fill("11");
    await exercise.getByLabel(/^Peso/).fill("7.5");
    await closeExerciseDialog(page);
    await page.getByRole("button", { name: "Guardar sesion" }).click();
    await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();
    const savedSessionId = new URL(page.url()).searchParams.get("sessionId");
    expect(savedSessionId).toBeTruthy();

    await page.getByRole("link", { name: "Ver historial", exact: true }).click();

    await expect(page).toHaveURL(/\/historial$/);
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
    const session = page.locator(`[data-session-id="${savedSessionId}"]`);
    const toggle = session.getByRole("button");
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(session.getByText("Serie 1")).toBeVisible();
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(session.getByText("11 rep")).toBeVisible();
    await expect(session.getByText("7,5 kg")).toBeVisible();
    await expect(session.getByText("12,5 min · 4,2 km")).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(".rr-app-shell.is-history .rr-main-content")).toHaveCSS(
      "max-width",
      "880px",
    );
    await expect(page.locator(".rr-history-day").first()).toHaveCSS("display", "grid");
    await expect(page.locator(".rr-history-day > header").first()).toHaveCSS("width", "168px");
    await expect(session.locator(".rr-history-exercises")).toHaveCSS("display", "grid");
    await expect(page.getByRole("link", { name: "Ver 30 días anteriores" })).toHaveAttribute(
      "href",
      /before=\d{4}-\d{2}-\d{2}/,
    );
    await expect(page.getByRole("button", { name: /editar|eliminar/i })).toHaveCount(0);
  });
});
