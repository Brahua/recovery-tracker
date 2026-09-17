import { expect, type Page } from "@playwright/test";

export async function openSessionForm(page: Page) {
  await page.goto("/registrar?mode=session");
  await expect(page.getByRole("heading", { name: "Registrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sesion" })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

export async function fillSessionBasics(page: Page) {
  await page.getByRole("slider", { name: "Durante" }).fill("3");
  await page.getByRole("slider", { name: "Despues" }).fill("2");
  await page.getByText("Media", { exact: true }).click();
  await page.getByText("Mejor que antes", { exact: true }).click();
}

export function exerciseDialog(page: Page) {
  return page.getByRole("dialog");
}

export function sessionExerciseRow(page: Page, name: string) {
  return page
    .getByRole("list", { name: "Ejercicios de la sesión" })
    .getByRole("button")
    .filter({ hasText: name });
}

export async function addQuickExercise(page: Page, name: string) {
  await page
    .getByRole("group", { name: "Más usados" })
    .getByRole("button", { name, exact: true })
    .click();
}

export async function searchExercise(page: Page, query: string) {
  await page.getByRole("button", { name: "+ Añadir ejercicio" }).click();
  const dialog = exerciseDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox", { name: "Nombre del ejercicio" }).fill(query);
  return dialog;
}

// Blur the name field so the suggestion list stops covering the sheet.
export async function dismissSuggestions(page: Page) {
  await exerciseDialog(page).locator(".rr-modal-sheet-header h2").click();
  await expect(exerciseDialog(page).getByRole("listbox")).toBeHidden();
}

export async function addExerciseFromCatalog(page: Page, query: string, name: string) {
  const dialog = await searchExercise(page, query);
  await dialog.getByRole("option").filter({ hasText: name }).first().click();
  await expect(dialog.getByRole("heading", { name, exact: true })).toBeVisible();
  return dialog;
}

export async function closeExerciseDialog(page: Page) {
  await exerciseDialog(page).getByRole("button", { name: "Listo" }).click();
  await expect(exerciseDialog(page)).toHaveCount(0);
}

export async function saveSession(page: Page) {
  await page.getByRole("button", { name: "Guardar sesion" }).click();
  await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();
  const sessionId = new URL(page.url()).searchParams.get("sessionId");
  expect(sessionId).toBeTruthy();
  return sessionId as string;
}

export async function openExerciseCatalog(page: Page) {
  await page.goto("/ejercicios");
  await expect(page.getByRole("heading", { name: "Ejercicios", exact: true })).toBeVisible();
}

export async function createCatalogExercise(
  page: Page,
  name: string,
  defaults: { series?: string; reps?: string; weight?: string } = {},
) {
  await openExerciseCatalog(page);
  await page.getByRole("button", { name: "+ Nuevo" }).click();
  const dialog = exerciseDialog(page);
  await dialog.getByLabel("Nombre", { exact: true }).fill(name);
  if (defaults.series) await dialog.getByLabel("Series").fill(defaults.series);
  if (defaults.reps) await dialog.getByLabel("Repeticiones").fill(defaults.reps);
  if (defaults.weight) await dialog.getByLabel(/^Peso/).fill(defaults.weight);
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(catalogRow(page, name)).toBeVisible();
}

export function catalogRow(page: Page, name: string) {
  return page
    .getByRole("list", { name: "Lista de ejercicios" })
    .getByRole("button")
    .filter({ hasText: name });
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export function routineExerciseRow(page: Page, name: string) {
  return page
    .getByRole("list", { name: "Ejercicios de la rutina" })
    .getByRole("button")
    .filter({ hasText: name });
}

export function routineListRow(page: Page, name: string) {
  return page.getByRole("list", { name: "Lista de rutinas" }).getByRole("link").filter({ hasText: name });
}

export async function openRoutines(page: Page) {
  await page.goto("/ejercicios?seccion=rutinas");
  await expect(page.getByRole("link", { name: /Rutinas/, exact: false }).first()).toHaveAttribute(
    "aria-current",
    "page",
  );
}

export interface RoutineItem {
  query: string;
  name: string;
  holdSeconds?: string;
  reps?: string;
}

export async function createRoutine(page: Page, routineName: string, items: RoutineItem[]) {
  await openRoutines(page);
  await page.getByRole("link", { name: "+ Nueva rutina" }).click();
  await expect(page.getByRole("heading", { name: "Nueva rutina" })).toBeVisible();
  await page.getByLabel("Nombre de la rutina").fill(routineName);

  for (const item of items) {
    const dialog = await addExerciseFromCatalog(page, item.query, item.name);
    if (item.holdSeconds || item.reps) {
      await dialog.getByRole("button", { name: "+ Añadir serie" }).click();
      if (item.holdSeconds) {
        await dialog.getByLabel("Segundos", { exact: true }).fill(item.holdSeconds);
      } else if (item.reps) {
        await dialog.getByLabel("Repeticiones").fill(item.reps);
      }
    }
    await closeExerciseDialog(page);
  }

  await page.getByRole("button", { name: "Guardar rutina" }).click();
  await expect(page).toHaveURL(/\/ejercicios\?seccion=rutinas$/);
  await expect(routineListRow(page, routineName)).toBeVisible();
}
