import { expect, test, type Page } from "@playwright/test";

import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

import { expectNoAxeViolations } from "./axe-helpers";
import { toast } from "./exercise-helpers";

// Older than Historial's default window, where no other spec closes a day (they use
// -1 to -28). Random so a CI retry does not hit the one-closeout-per-day rule.
const baseOffset = -(40 + Math.floor(Math.random() * 300));
const dayAt = (step: number) => addRecoveryDays(getRecoveryDateKey(), baseOffset - step);

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
    await page.getByRole("button", { name: /cambiar/i }).click();
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
    await page.getByRole("button", { name: /cambiar/i }).click();
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
