import { expect, test } from "@playwright/test";

import {
  addExerciseFromCatalog,
  catalogRow,
  closeExerciseDialog,
  createCatalogExercise,
  createRoutine,
  exerciseDialog,
  fillSessionBasics,
  openExerciseCatalog,
  openRoutines,
  openSessionForm,
  routineExerciseRow,
  routineListRow,
  saveSession,
  sessionExerciseRow,
  uniqueName,
} from "./exercise-helpers";

test.describe("routines", () => {
  test("creates a routine with an isometric exercise and a partial plan", async ({ page }) => {
    const name = uniqueName("Core e2e");
    await openRoutines(page);
    await page.getByRole("link", { name: "+ Nueva rutina" }).click();
    await page.getByLabel("Nombre de la rutina").fill(name);

    const wallSit = await addExerciseFromCatalog(page, "wall", "Wall sit");
    await wallSit.getByRole("button", { name: "+ Añadir serie" }).click();
    await wallSit.getByLabel("Segundos", { exact: true }).fill("45");
    await closeExerciseDialog(page);
    await addExerciseFromCatalog(page, "step-u", "Step-up");
    await closeExerciseDialog(page);

    await expect(routineExerciseRow(page, "Wall sit")).toContainText("1 × 45 s");
    await expect(routineExerciseRow(page, "Step-up")).toContainText("Sin plan");
    await page.getByRole("button", { name: "Guardar rutina" }).click();

    await expect(page).toHaveURL(/\/ejercicios\?seccion=rutinas$/);
    await expect(routineListRow(page, name)).toContainText("2 ejercicios");
    await expect(routineListRow(page, name)).toContainText("Wall sit · Step-up");
  });

  test("adds routine exercises when logging and skips the ones already there", async ({ page }) => {
    const name = uniqueName("Fisio e2e");
    await createRoutine(page, name, [
      { query: "wall", name: "Wall sit", holdSeconds: "40" },
      { query: "step-u", name: "Step-up" },
    ]);

    await openSessionForm(page);
    await fillSessionBasics(page);
    const stepUp = await addExerciseFromCatalog(page, "step-u", "Step-up");
    await stepUp.getByRole("button", { name: "+ Añadir serie" }).click();
    await stepUp.getByLabel("Repeticiones").fill("10");
    await closeExerciseDialog(page);

    await page.getByRole("button", { name: "Usar rutina" }).click();
    await exerciseDialog(page)
      .getByRole("list", { name: "Rutinas disponibles" })
      .getByRole("button")
      .filter({ hasText: name })
      .click();

    await expect(page.locator(".rr-routine-added")).toHaveText(
      `Se agregó 1 ejercicio de "${name}" · 1 ya estaba`,
    );
    await expect(sessionExerciseRow(page, "Step-up")).toContainText("1 × 10");
    await expect(sessionExerciseRow(page, "Wall sit")).toContainText("1 × 40 s");
    await saveSession(page);
  });

  test("saves a logged session as a routine", async ({ page }) => {
    const name = uniqueName("Desde sesion e2e");
    await openSessionForm(page);
    await fillSessionBasics(page);
    const wallSit = await addExerciseFromCatalog(page, "wall", "Wall sit");
    await wallSit.getByRole("button", { name: "+ Añadir serie" }).click();
    await wallSit.getByLabel("Segundos", { exact: true }).fill("30");
    await wallSit.getByRole("button", { name: "Duplicar serie 1" }).click();
    await closeExerciseDialog(page);
    await saveSession(page);

    await page.getByRole("button", { name: "Guardar como rutina" }).click();
    const dialog = exerciseDialog(page);
    await dialog.getByLabel("Nombre de la rutina").fill(name);
    await dialog.getByRole("button", { name: "Guardar rutina" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Rutina guardada" })).toBeVisible();

    await page.getByRole("link", { name: "Ver rutina" }).click();
    await expect(page.getByRole("heading", { name: "Editar rutina" })).toBeVisible();
    await expect(page.getByLabel("Nombre de la rutina")).toHaveValue(name);
    await expect(routineExerciseRow(page, "Wall sit")).toContainText("2 × 30 s");
  });

  test("merging catalog exercises updates routines without repeats", async ({ page }) => {
    const source = uniqueName("Origen e2e");
    const target = uniqueName("Destino e2e");
    const routine = uniqueName("Fusion e2e");
    await createCatalogExercise(page, source);
    await createCatalogExercise(page, target);
    await createRoutine(page, routine, [
      { query: source, name: source, reps: "5" },
      { query: target, name: target, reps: "8" },
    ]);

    await openExerciseCatalog(page);
    await catalogRow(page, source).click();
    const edit = exerciseDialog(page);
    await edit.getByRole("button", { name: "Fusionar con otro ejercicio…" }).click();
    await edit.getByLabel("Fusionar en").selectOption({ label: target });
    await edit.getByRole("button", { name: "Fusionar y eliminar" }).click();
    await expect(exerciseDialog(page)).toHaveCount(0);

    await openRoutines(page);
    await expect(routineListRow(page, routine)).toContainText("1 ejercicio");
    await routineListRow(page, routine).click();
    await expect(routineExerciseRow(page, target)).toContainText("1 × 8");
    await expect(routineExerciseRow(page, source)).toHaveCount(0);
  });

  test("deleting a routine keeps logged sessions in history", async ({ page }) => {
    const name = uniqueName("Borrar e2e");
    await createRoutine(page, name, [{ query: "puente", name: "Puente de gluteos", reps: "12" }]);

    await openSessionForm(page);
    await fillSessionBasics(page);
    await page.getByRole("button", { name: "Usar rutina" }).click();
    await exerciseDialog(page)
      .getByRole("list", { name: "Rutinas disponibles" })
      .getByRole("button")
      .filter({ hasText: name })
      .click();
    const sessionId = await saveSession(page);

    await openRoutines(page);
    await routineListRow(page, name).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar eliminación" }).click();
    await expect(page).toHaveURL(/\/ejercicios\?seccion=rutinas$/);
    await expect(routineListRow(page, name)).toHaveCount(0);

    await page.goto("/historial");
    const session = page.locator(`[data-session-id="${sessionId}"]`);
    const toggle = session.getByRole("button").first();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(session.getByText("Puente de gluteos")).toBeVisible();
    await expect(session.getByText("Serie 1 · 12 rep")).toBeVisible();
  });
});
