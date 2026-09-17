import { expect, test } from "@playwright/test";

import {
  addExerciseFromCatalog,
  addQuickExercise,
  closeExerciseDialog,
  exerciseDialog,
  openSessionForm,
  sessionExerciseRow,
} from "./exercise-helpers";

test.describe("post-therapy check-in", () => {
  test("saves a session and keeps its summary visible after reload", async ({ page }) => {
    await openSessionForm(page);

    await page.getByRole("slider", { name: "Antes" }).fill("4");
    await page.getByRole("slider", { name: "Durante" }).fill("5");
    await page.getByRole("slider", { name: "Despues" }).fill("3");
    await page.getByText("Media", { exact: true }).click();

    await addQuickExercise(page, "Bicicleta 5-10 min");
    await expect(sessionExerciseRow(page, "Bicicleta 5-10 min")).toContainText("10 min");
    await sessionExerciseRow(page, "Bicicleta 5-10 min").click();
    const bicycle = exerciseDialog(page);
    await bicycle.getByLabel(/Duración total/).fill("12.5");
    await bicycle.getByLabel(/Distancia total/).fill("4.2");
    await closeExerciseDialog(page);

    const stepUp = await addExerciseFromCatalog(page, "step-u", "Step-up");
    await stepUp.getByRole("button", { name: "+ Añadir serie" }).click();
    await stepUp.getByLabel("Repeticiones").fill("12");
    await stepUp.getByLabel(/^Peso/).fill("10");
    await stepUp.getByRole("button", { name: "Duplicar serie 1" }).click();
    await stepUp.getByLabel("Repeticiones").nth(1).fill("8");
    await stepUp.getByLabel(/^Peso/).nth(1).fill("12.5");
    await closeExerciseDialog(page);

    await expect(sessionExerciseRow(page, "Bicicleta 5-10 min")).toContainText("12,5 min · 4,2 km");
    await expect(sessionExerciseRow(page, "Step-up")).toContainText("2 × 8–12 · 10–12,5 kg");

    await page.getByText("Mejor que antes", { exact: true }).click();
    await page.getByRole("button", { name: "Añadir nota" }).click();
    await page
      .getByPlaceholder("Algo que quieras recordar...")
      .fill("Sesion automatizada con catalogo.");

    await page.getByRole("button", { name: "Guardar sesion" }).click();

    await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();
    const summary = page.getByLabel("Resumen de la sesion");
    await expect(summary.getByText("Fisio guiada")).toBeVisible();
    await expect(summary.getByText("2", { exact: true })).toBeVisible();
    await expect(summary.getByText("4 → 3")).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();
    await expect(page.getByLabel("Resumen de la sesion").getByText("4 → 3")).toBeVisible();
  });

  test("keeps save disabled until every required session step is complete", async ({ page }) => {
    await openSessionForm(page);

    const saveButton = page.getByRole("button", { name: "Guardar sesion" });
    await expect(saveButton).toBeDisabled();
    await page.getByRole("slider", { name: "Durante" }).fill("3");
    await page.getByRole("slider", { name: "Despues" }).fill("3");
    await page.getByText("Igual", { exact: true }).click();

    const wallSit = await addExerciseFromCatalog(page, "wall", "Wall sit");
    await expect(wallSit.getByRole("checkbox", { name: /Isométrico/ })).toBeChecked();
    await expect(saveButton).toBeDisabled();
    await expect(saveButton).toContainText("faltan 1");
    await wallSit.getByRole("button", { name: "+ Añadir serie" }).click();
    await wallSit.getByLabel("Segundos", { exact: true }).fill("45");
    await closeExerciseDialog(page);
    await expect(sessionExerciseRow(page, "Wall sit")).toContainText("1 × 45 s");
    await expect(saveButton).toBeEnabled();

    const bridge = await addExerciseFromCatalog(page, "puente", "Puente de gluteos");
    await expect(bridge).toContainText("Falta completar este ejercicio");
    await closeExerciseDialog(page);
    await expect(sessionExerciseRow(page, "Puente de gluteos")).toContainText("Completar");
    await expect(saveButton).toBeDisabled();

    await sessionExerciseRow(page, "Puente de gluteos").click();
    await exerciseDialog(page).getByRole("button", { name: "Quitar ejercicio" }).click();
    await expect(saveButton).toBeEnabled();

    await page.getByRole("button", { name: "Añadir nota" }).click();
    const note = page.getByPlaceholder("Algo que quieras recordar...");
    await note.fill("Conservar esta nota si el servidor rechaza el envío.");
    await page.locator('input[name="exercisesPayload"]').evaluate((input) => {
      (input as HTMLInputElement).value = "[]";
    });
    await saveButton.click();

    await expect(page).toHaveURL(/\/registrar\?mode=session$/);
    await expect(page.locator(".rr-session-error")).toContainText(
      "Completa o elimina todos los ejercicios seleccionados",
    );
    await expect(page.getByRole("slider", { name: "Durante" })).toHaveValue("3");
    await expect(sessionExerciseRow(page, "Wall sit")).toContainText("1 × 45 s");
    await expect(note).toHaveValue("Conservar esta nota si el servidor rechaza el envío.");
  });
});
