import { expect, test } from "@playwright/test";

import {
  addExerciseFromCatalog,
  catalogRow,
  closeExerciseDialog,
  createCatalogExercise,
  dismissSuggestions,
  exerciseDialog,
  fillSessionBasics,
  openExerciseCatalog,
  openSessionForm,
  saveSession,
  searchExercise,
  sessionExerciseRow,
  uniqueName,
} from "./exercise-helpers";

test.describe("exercise catalog", () => {
  test("suggests matches while typing and creates a new exercise on save", async ({ page }) => {
    await openSessionForm(page);
    await fillSessionBasics(page);

    const suggestions = await searchExercise(page, "glu");
    // TEMP diagnostic for a first-attempt flake; remove once understood.
    console.log("[diag] retry", test.info().retry, JSON.stringify({
      quickPicks: await page.locator(".rr-exercise-quick button").allInnerTexts(),
      combobox: await suggestions.getByRole("combobox").inputValue(),
      expanded: await suggestions.getByRole("combobox").getAttribute("aria-expanded"),
      focused: await suggestions.getByRole("combobox").evaluate((el) => el === document.activeElement),
      options: await suggestions.locator("[role=option]").allInnerTexts(),
    }));
    await expect(suggestions.getByRole("option").filter({ hasText: "Puente de gluteos" })).toBeVisible();
    await suggestions.getByRole("button", { name: "Quitar ejercicio" }).click();
    await expect(exerciseDialog(page)).toHaveCount(0);

    const name = uniqueName("Prensa e2e");
    const dialog = await searchExercise(page, name);
    await expect(dialog.getByRole("option").filter({ hasText: `Crear “${name}”` })).toBeVisible();
    await dismissSuggestions(page);
    await dialog.getByRole("button", { name: "+ Añadir serie" }).click();
    await dialog.getByLabel("Repeticiones").fill("10");
    await closeExerciseDialog(page);
    await expect(sessionExerciseRow(page, name)).toContainText("1 × 10");
    await saveSession(page);

    await openExerciseCatalog(page);
    await page.getByPlaceholder("Buscar ejercicio").fill(name);
    await expect(catalogRow(page, name)).toContainText("1 sesión");
  });

  test("records isometric holds and shows the seconds in history", async ({ page }) => {
    await openSessionForm(page);
    await fillSessionBasics(page);

    const wallSit = await addExerciseFromCatalog(page, "wall", "Wall sit");
    await expect(wallSit.getByRole("checkbox", { name: /Isométrico/ })).toBeChecked();
    await wallSit.getByRole("button", { name: "+ Añadir serie" }).click();
    await wallSit.getByLabel("Segundos", { exact: true }).fill("45");
    await wallSit.getByRole("button", { name: "Duplicar serie 1" }).click();
    await closeExerciseDialog(page);
    await expect(sessionExerciseRow(page, "Wall sit")).toContainText("2 × 45 s");

    const sessionId = await saveSession(page);
    await page.goto("/historial");
    const session = page.locator(`[data-session-id="${sessionId}"]`);
    const toggle = session.getByRole("button").first();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(session.getByText("Isométrico")).toBeVisible();
    await expect(session.getByText("Serie 2 · 45 s")).toBeVisible();
  });

  test("autocompletes catalog defaults without overwriting the entry", async ({ page }) => {
    const name = uniqueName("Sentadilla e2e");
    await createCatalogExercise(page, name, { series: "3", reps: "12", weight: "5" });
    await expect(catalogRow(page, name)).toContainText("3 × 12 · 5 kg");

    await openSessionForm(page);
    const dialog = await addExerciseFromCatalog(page, name.slice(0, 12).toLowerCase(), name);
    await expect(dialog.getByLabel("Repeticiones")).toHaveCount(3);
    await dialog.getByLabel("Repeticiones").nth(2).fill("10");
    await closeExerciseDialog(page);
    await expect(sessionExerciseRow(page, name)).toContainText("3 × 10–12 · 5 kg");
  });

  test("archives an exercise and reactivates it when it is logged again", async ({ page }) => {
    const name = uniqueName("Archivar e2e");
    await createCatalogExercise(page, name);

    await catalogRow(page, name).click();
    await exerciseDialog(page).getByRole("button", { name: "Archivar" }).click();
    await expect(exerciseDialog(page)).toHaveCount(0);
    await expect(catalogRow(page, name)).toHaveCount(0);
    await page.getByRole("button", { name: /Archivados/ }).click();
    await expect(catalogRow(page, name)).toBeVisible();

    await openSessionForm(page);
    await fillSessionBasics(page);
    const dialog = await searchExercise(page, name);
    await expect(dialog.getByRole("option")).toHaveCount(1);
    await dialog.getByRole("option").filter({ hasText: `Reactivar “${name}”` }).click();
    await expect(dialog.getByText(`Se reactivará “${name}” al guardar.`)).toBeVisible();
    await dialog.getByRole("button", { name: "+ Añadir serie" }).click();
    await dialog.getByLabel("Repeticiones").fill("6");
    await closeExerciseDialog(page);
    await saveSession(page);

    await openExerciseCatalog(page);
    await expect(catalogRow(page, name)).toContainText("1 sesión");
  });

  test("links typed names to the catalog like the database does", async ({ page }) => {
    await openSessionForm(page);
    await fillSessionBasics(page);

    for (const typedName of ["PUENTE DE GLÚTEOS", "sentadilla  ESPAÑOLA"]) {
      const dialog = await searchExercise(page, typedName);
      await expect(dialog.getByRole("option").filter({ hasText: "Crear" })).toHaveCount(0);
      await dismissSuggestions(page);
      await dialog.getByRole("button", { name: "+ Añadir serie" }).click();
      await dialog.getByLabel("Repeticiones").fill("8");
      await closeExerciseDialog(page);
    }
    await saveSession(page);

    await openExerciseCatalog(page);
    await page.getByPlaceholder("Buscar ejercicio").fill("puente");
    await expect(page.getByRole("list", { name: "Lista de ejercicios" }).getByRole("button")).toHaveCount(1);
    await page.getByPlaceholder("Buscar ejercicio").fill("sentadilla esp");
    await expect(page.getByRole("list", { name: "Lista de ejercicios" }).getByRole("button")).toHaveCount(1);
  });

  test("blocks saving the same exercise twice in one session", async ({ page }) => {
    await openSessionForm(page);
    await fillSessionBasics(page);

    const wallSit = await addExerciseFromCatalog(page, "wall", "Wall sit");
    await wallSit.getByRole("button", { name: "+ Añadir serie" }).click();
    await wallSit.getByLabel("Segundos", { exact: true }).fill("30");
    await closeExerciseDialog(page);

    const typed = await searchExercise(page, "wall sit");
    await expect(typed.getByRole("option").filter({ hasText: /^Wall sit$/ })).toHaveCount(0);
    await dismissSuggestions(page);
    await typed.getByRole("button", { name: "+ Añadir serie" }).click();
    await typed.getByLabel("Repeticiones").fill("5");
    await expect(typed.getByText("Este ejercicio ya está en la sesión")).toBeVisible();
    await closeExerciseDialog(page);

    const rows = sessionExerciseRow(page, "wall sit");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText("Repetido");
    await expect(page.getByRole("button", { name: "Guardar sesion" })).toBeDisabled();
  });

  test("merges duplicates and keeps the logged name in history", async ({ page }) => {
    const source = uniqueName("Sentadilla pared e2e");
    const target = uniqueName("Wall sit copia e2e");
    await createCatalogExercise(page, source);
    await createCatalogExercise(page, target);

    await openSessionForm(page);
    await fillSessionBasics(page);
    const dialog = await addExerciseFromCatalog(page, source, source);
    await dialog.getByRole("button", { name: "+ Añadir serie" }).click();
    await dialog.getByLabel("Repeticiones").fill("5");
    await closeExerciseDialog(page);
    const sessionId = await saveSession(page);

    await openExerciseCatalog(page);
    await catalogRow(page, source).click();
    const edit = exerciseDialog(page);
    await edit.getByRole("button", { name: "Fusionar con otro ejercicio…" }).click();
    await edit.getByLabel("Fusionar en").selectOption({ label: target });
    await expect(edit.getByRole("status")).toContainText("Se moverán 1 sesión");
    await edit.getByRole("button", { name: "Fusionar y eliminar" }).click();
    await expect(exerciseDialog(page)).toHaveCount(0);
    await expect(catalogRow(page, source)).toHaveCount(0);
    await expect(catalogRow(page, target)).toContainText("1 sesión");

    await page.goto("/historial");
    const session = page.locator(`[data-session-id="${sessionId}"]`);
    const toggle = session.getByRole("button").first();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(session.getByText(source)).toBeVisible();
  });

  test("closes the exercise sheet with Escape and returns focus", async ({ page }) => {
    await openSessionForm(page);
    const addButton = page.getByRole("button", { name: "+ Añadir ejercicio" });
    await addButton.click();
    await expect(exerciseDialog(page)).toBeVisible();
    await expect(
      exerciseDialog(page).getByRole("combobox", { name: "Nombre del ejercicio" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(exerciseDialog(page)).toHaveCount(0);
    await expect(addButton).toBeFocused();
    await expect(page.getByRole("list", { name: "Ejercicios de la sesión" })).toHaveCount(0);
  });
});
