import { expect, test, type Page } from "@playwright/test";

import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

import { expectNoAxeViolations } from "./axe-helpers";
import {
  addExerciseFromCatalog,
  closeExerciseDialog,
  exerciseDialog,
  fillSessionBasics,
  openSessionForm,
  saveSession,
  sessionExerciseRow,
  toast,
} from "./exercise-helpers";

// Days older than Historial's default window, where no other spec closes a day (they
// use -1 to -28). Each worker gets its own block of 10 days: workerIndex is unique in a
// run (a retry starts a new worker), so parallel tests and retries never share a date.
const dayAt = (step: number) =>
  addRecoveryDays(getRecoveryDateKey(), -(40 + test.info().workerIndex * 10 + step));

async function createCloseout(page: Page, date: string, pain: string) {
  await page.goto(`/registrar?mode=closeout&date=${date}`);
  await page.getByRole("slider", { name: "Dolor" }).fill(pain);
  await page.getByText("Alta", { exact: true }).click();
  await page.getByText("Leve", { exact: true }).click();
  await page.getByText("Buena", { exact: true }).click();
  await page.getByRole("button", { name: "Cerrar el dia" }).click();
  await expect(toast(page, "Cierre guardado")).toBeVisible();
  const closeoutId = new URL(page.url()).searchParams.get("closeoutId");
  expect(closeoutId).toBeTruthy();
  return closeoutId as string;
}

async function openCloseoutEditor(page: Page, date: string, closeoutId: string) {
  await page.goto(getHistoryHrefForDate(date));
  const card = page.locator(`[data-closeout-id="${closeoutId}"]`);
  await card.getByRole("link", { name: "Editar cierre del día" }).click();
  await expect(page.getByRole("heading", { name: "Editar cierre" })).toBeVisible();
}

test.describe.serial("edit past closeouts", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("corrects a closeout and moves it to a free date", async ({ page }) => {
    const originalDate = dayAt(0);
    const newDate = dayAt(1);
    const closeoutId = await createCloseout(page, originalDate, "3");

    await openCloseoutEditor(page, originalDate, closeoutId);
    await expect(page.getByRole("slider", { name: "Dolor" })).toHaveValue("3");
    await expectNoAxeViolations(page);

    await page.getByRole("slider", { name: "Dolor" }).fill("6");
    await page.getByRole("textbox", { name: "Fecha del cierre" }).fill(newDate);
    await expect(page).toHaveURL(new RegExp(`date=${newDate}`));
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(toast(page, "Cierre actualizado")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/historial\\?before=${newDate}`));
    const card = page.locator(`[data-closeout-id="${closeoutId}"]`);
    await expect(card.getByText("Dolor final 6/10")).toBeVisible();
  });

  test("does not move a closeout onto a day that already has one", async ({ page }) => {
    const takenDate = dayAt(2);
    await createCloseout(page, takenDate, "2");
    const movingDate = dayAt(3);
    const closeoutId = await createCloseout(page, movingDate, "4");

    await openCloseoutEditor(page, movingDate, closeoutId);
    await page.getByRole("textbox", { name: "Fecha del cierre" }).fill(takenDate);

    await expect(
      page.getByText("Ese día ya tiene un cierre registrado. Elige otra fecha."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });

  test("deletes a closeout after confirming", async ({ page }) => {
    const date = dayAt(4);
    const closeoutId = await createCloseout(page, date, "5");

    await openCloseoutEditor(page, date, closeoutId);
    await page.getByRole("button", { name: "Eliminar cierre" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar este cierre?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await expectNoAxeViolations(page);

    await dialog.getByRole("button", { name: "Eliminar", exact: true }).click();

    await expect(toast(page, "Cierre eliminado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
    await expect(page.locator(`[data-closeout-id="${closeoutId}"]`)).toHaveCount(0);
  });

  test("shows the not-found page for a closeout that does not exist", async ({ page }) => {
    await page.goto("/registrar/cierre/8f14e45f-ceea-4e7a-9b1c-3d5a6f7e8a9b");
    await expect(page.getByText("No encontramos ese registro")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir a Historial" })).toBeVisible();
  });
});

// "En casa", not the default physio type: Hoy shows the latest physio session's
// instructions, and physio-treatments.spec.ts runs in parallel with the same user.
async function createSession(page: Page) {
  await openSessionForm(page);
  await page.getByText("En casa", { exact: true }).click();
  await fillSessionBasics(page);
  const exercise = await addExerciseFromCatalog(page, "step-u", "Step-up");
  await exercise.getByRole("button", { name: "+ Añadir serie" }).click();
  await exercise.getByLabel("Repeticiones").fill("10");
  await exercise.getByLabel(/^Peso/).fill("5");
  await closeExerciseDialog(page);
  return saveSession(page);
}

async function openSessionEditor(page: Page, sessionId: string) {
  await page.goto("/historial");
  const session = page.locator(`[data-session-id="${sessionId}"]`);
  const toggle = session.getByRole("button").first();
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await session.getByRole("link", { name: "Editar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Editar sesión" })).toBeVisible();
}

test.describe.serial("edit past sessions", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("corrects pain, a set and the date of a session", async ({ page }) => {
    const sessionId = await createSession(page);
    const newDate = dayAt(5);

    await openSessionEditor(page, sessionId);
    await expect(page.getByRole("slider", { name: "Despues" })).toHaveValue("2");
    await expect(page.getByRole("button", { name: "Usar rutina" })).toHaveCount(0);
    await expectNoAxeViolations(page);

    await page.getByRole("slider", { name: "Despues" }).fill("4");
    await sessionExerciseRow(page, "Step-up").click();
    await exerciseDialog(page).getByLabel("Repeticiones").fill("12");
    await closeExerciseDialog(page);
    await page.getByLabel("Fecha y hora").fill(`${newDate}T09:15`);
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(toast(page, "Sesión actualizada")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/historial\\?before=${newDate}`));
    const session = page.locator(`[data-session-id="${sessionId}"]`);
    await expect(session.getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
    await expect(session.getByText("Dolor 3 → 4")).toBeVisible();
    await expect(session.getByText(/9:15/)).toBeVisible();
    await expect(session.getByText("12 rep")).toBeVisible();
  });

  test("deletes a session after confirming", async ({ page }) => {
    const sessionId = await createSession(page);

    await openSessionEditor(page, sessionId);
    await page.getByRole("button", { name: "Eliminar sesión" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar esta sesión?" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText("Se borran sus ejercicios, series y tratamientos."),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();

    await dialog.getByRole("button", { name: "Eliminar", exact: true }).click();

    await expect(toast(page, "Sesión eliminada")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
    await expect(page.locator(`[data-session-id="${sessionId}"]`)).toHaveCount(0);
  });

  test("shows the not-found page for a session that does not exist", async ({ page }) => {
    await page.goto("/registrar/sesion/8f14e45f-ceea-4e7a-9b1c-3d5a6f7e8a9b");
    await expect(page.getByText("No encontramos ese registro")).toBeVisible();
  });
});

test.describe("correct right after saving", () => {
  test("opens the session editor from the saved screen", async ({ page }) => {
    const sessionId = await createSession(page);

    await page.getByRole("link", { name: "Corregir la sesión" }).click();

    await expect(page).toHaveURL(new RegExp(`/registrar/sesion/${sessionId}$`));
    await expect(page.getByRole("heading", { name: "Editar sesión" })).toBeVisible();
  });

  test("opens the closeout editor from the closed-day screen", async ({ page }) => {
    const closeoutId = await createCloseout(page, dayAt(6), "3");

    await page.getByRole("link", { name: "Corregir el cierre" }).click();

    await expect(page).toHaveURL(new RegExp(`/registrar/cierre/${closeoutId}$`));
    await expect(page.getByRole("heading", { name: "Editar cierre" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Dolor" })).toHaveValue("3");
  });
});
