import { expect, test, type Page } from "@playwright/test";

import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

import { insertSessionOn } from "./admin-helpers";
import { expectNoAxeViolations } from "./axe-helpers";
import { toast } from "./exercise-helpers";

// "¿Cómo amaneciste?" (docs/specs/morning-checkin-and-daily-goal-spec.md). Days far back, where no
// other spec writes: each worker gets its own block of 20 days (a retry starts a new worker).
const dayAt = (step: number) =>
  addRecoveryDays(getRecoveryDateKey(), -(200 + test.info().workerIndex * 20 + step));

async function openMorning(page: Page, date?: string) {
  await page.goto(`/registrar?mode=morning${date ? `&date=${date}` : ""}`);
  await expect(page.getByRole("heading", { name: "¿Cómo amaneciste?" })).toBeVisible();
}

async function answerBasics(page: Page, pain = "2") {
  await page.getByText("Bien", { exact: true }).click();
  await page.getByRole("slider", { name: "Dolor al despertar" }).fill(pain);
  await page.getByText("Un poco", { exact: true }).click();
}

const saveButton = (page: Page) => page.getByRole("button", { name: /Guardar mañana/ });

test.describe("morning check-in", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("old closeout links open the morning check-in", async ({ page }) => {
    await page.goto("/registrar?mode=closeout");
    await expect(page.getByRole("heading", { name: "¿Cómo amaneciste?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mañana" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("saves a morning and shows it in Historial", async ({ page }) => {
    const date = dayAt(0);
    await openMorning(page, date);
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Restar media hora" }).click();
    await answerBasics(page, "3");
    await page.getByRole("button", { name: "+ Añadir nota (opcional)" }).click();
    await page.getByLabel("Nota de la mañana").fill("Me desperté una vez.");
    await saveButton(page).click();

    await expect(page.getByRole("heading", { name: "Que tengas buen día." })).toBeVisible();
    await expect(toast(page, "Mañana guardada")).toBeVisible();

    await page.goto(getHistoryHrefForDate(date));
    const card = page
      .locator("[data-morning-checkin-id]")
      .filter({ hasText: "Me desperté una vez." });
    await expect(card.getByText("Sueño 7 h · buena")).toBeVisible();
    await expect(card.getByText("Dolor al despertar 3/10")).toBeVisible();
    await expect(card.getByText("Rigidez un poco")).toBeVisible();
  });

  test("asks about the rebound only after a day with sessions", async ({ page, context }) => {
    const afterSession = dayAt(1);
    await insertSessionOn(context, addRecoveryDays(afterSession, -1));
    await openMorning(page, afterSession);
    await expect(page.getByRole("group", { name: "Rebote de la sesión anterior" })).toBeVisible();
    await answerBasics(page);
    // Four steps: the rebound is still missing.
    await expect(saveButton(page)).toBeDisabled();
    await page.getByText("Leve", { exact: true }).click();
    await expect(saveButton(page)).toBeEnabled();

    const afterRest = dayAt(3);
    await openMorning(page, afterRest);
    await expect(page.getByRole("group", { name: "Rebote de la sesión anterior" })).toHaveCount(0);
    await answerBasics(page);
    await expect(saveButton(page)).toBeEnabled();
  });

  test("keeps save disabled until every step is answered", async ({ page }) => {
    await openMorning(page, dayAt(4));
    await expect(saveButton(page)).toBeDisabled();
    await page.getByText("Bien", { exact: true }).click();
    await page.getByRole("slider", { name: "Dolor al despertar" }).fill("4");
    await expect(saveButton(page)).toBeDisabled();
    await page.getByText("Mucha", { exact: true }).click();
    await expect(saveButton(page)).toBeEnabled();
  });

  test("blocks a second morning for the same day", async ({ page }) => {
    const date = dayAt(5);
    await openMorning(page, date);
    await answerBasics(page);
    await saveButton(page).click();
    await expect(page.getByRole("heading", { name: "Que tengas buen día." })).toBeVisible();

    await openMorning(page, date);
    await expect(
      page.getByText("Ese día ya tiene un registro de la mañana. Elige otra fecha."),
    ).toBeVisible();
    await answerBasics(page);
    await expect(saveButton(page)).toBeDisabled();
  });

  test("rejects a future date on the server without losing the answers", async ({ page }) => {
    await openMorning(page);
    await answerBasics(page, "4");
    await page.getByRole("button", { name: "+ Añadir nota (opcional)" }).click();
    await page.getByLabel("Nota de la mañana").fill("Conservar si la fecha es rechazada.");
    // The picker's max blocks this in the browser; drop it to prove the server rejects it too.
    const futureDate = addRecoveryDays(getRecoveryDateKey(), 1);
    await page.locator('input[name="date"]').evaluate((input, value) => {
      const dateInput = input as HTMLInputElement;
      dateInput.removeAttribute("max");
      dateInput.value = value;
    }, futureDate);
    await saveButton(page).click();

    await expect(page.locator(".rr-session-error")).toContainText(
      "No puedes registrar una mañana con fecha futura",
    );
    await expect(page.getByRole("slider", { name: "Dolor al despertar" })).toHaveValue("4");
    await expect(page.getByLabel("Nota de la mañana")).toHaveValue(
      "Conservar si la fecha es rechazada.",
    );
  });

  test("corrects and deletes a morning from Historial", async ({ page }) => {
    const date = dayAt(6);
    await openMorning(page, date);
    await answerBasics(page, "2");
    await saveButton(page).click();
    await expect(page.getByRole("heading", { name: "Que tengas buen día." })).toBeVisible();
    const checkinId = new URL(page.url()).searchParams.get("checkinId");
    expect(checkinId).toBeTruthy();

    await page.goto(getHistoryHrefForDate(date));
    const card = page.locator(`[data-morning-checkin-id="${checkinId}"]`);
    await card.getByRole("link", { name: "Editar registro de la mañana" }).click();
    await expect(page.getByRole("heading", { name: "Editar mañana" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Dolor al despertar" })).toHaveValue("2");
    await page.getByRole("slider", { name: "Dolor al despertar" }).fill("5");
    await page.getByRole("button", { name: /Guardar cambios/ }).click();

    await expect(toast(page, "Registro de la mañana actualizado")).toBeVisible();
    await expect(card.getByText("Dolor al despertar 5/10")).toBeVisible();

    await card.getByRole("button", { name: "Eliminar registro de la mañana" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar este registro?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Eliminar", exact: true }).click();
    await expect(toast(page, "Registro de la mañana eliminado")).toBeVisible();
    await expect(page.locator(`[data-morning-checkin-id="${checkinId}"]`)).toHaveCount(0);
  });

  test("Hoy offers it until today's morning is saved", async ({ page }) => {
    await page.goto("/");
    const offer = page.getByRole("link", { name: /¿Cómo amaneciste\?/ }).first();
    // Today's morning may already exist if this test ran before (a retry); then it is not offered.
    if (await offer.isVisible()) {
      await offer.click();
      await expect(page.getByRole("heading", { name: "¿Cómo amaneciste?" })).toBeVisible();
      await answerBasics(page);
      await saveButton(page).click();
      await expect(page.getByRole("heading", { name: "Que tengas buen día." })).toBeVisible();
      await page.goto("/");
    }
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
    await expect(page.getByText("Última mañana")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sueño, dolor y rigidez al despertar/ }),
    ).toHaveCount(0);
  });
});
