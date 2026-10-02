import { expect, test, type Page } from "@playwright/test";

import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

async function ensureAuthenticated(page: Page) {
  await page.goto("/registrar?mode=closeout");
  await expect(page.getByRole("heading", { name: "Registrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cierre del dia" })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

test.describe("nightly closeout", () => {
  test("saves a closeout and keeps it visible after reload", async ({ page }) => {
    await ensureAuthenticated(page);
    const yesterday = addRecoveryDays(getRecoveryDateKey(), -1);
    const dateInput = page.getByLabel("Fecha y hora del cierre");
    await expect(dateInput).toHaveAttribute("max", `${getRecoveryDateKey()}T23:59`);
    await dateInput.fill(`${yesterday}T22:30`);
    await page.getByRole("slider", { name: "Dolor" }).fill("3");
    await page.getByText("Alta", { exact: true }).click();
    await page.getByText("Leve", { exact: true }).click();
    await page.getByText("Buena", { exact: true }).click();
    await page
      .getByPlaceholder("Lo que quieras dejar escrito antes de dormir...")
      .fill(`Cierre automatizado ${Date.now()}`);

    await page.getByRole("button", { name: "Cerrar el dia" }).click();

    await expect(
      page.getByRole("heading", { name: /^(Dia cerrado|Cierre guardado)\.$/ }),
    ).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Cierre guardado" })).toBeVisible();
    await expect(page.getByText("Cierre del dia")).toBeVisible();
    await expect(page.getByText("dolor 3")).toBeVisible();
    await expect(page.getByText(/^Ayer · registrado/)).toBeVisible();

    await page.reload();

    await expect(page.getByText("Cierre del dia")).toBeVisible();
    await expect(page.getByText("dolor 3")).toBeVisible();
  });

  test("stiffness is optional and shows in Historial", async ({ page }) => {
    await ensureAuthenticated(page);
    // -29 stays clear of the other specs' dates (accessibility uses -3…-28) and inside Historial's 30 days.
    const closedDate = addRecoveryDays(getRecoveryDateKey(), -29);
    await page.getByLabel("Fecha y hora del cierre").fill(`${closedDate}T22:15`);
    await page.getByRole("slider", { name: "Dolor" }).fill("2");
    await page.getByText("Media", { exact: true }).click();
    await page.getByText("Nada", { exact: true }).click();
    await page.getByText("Regular", { exact: true }).click();
    await page.getByText("Bastante", { exact: true }).click();
    await page.getByRole("button", { name: "Cerrar el dia" }).click();
    await expect(
      page.getByRole("heading", { name: /^(Dia cerrado|Cierre guardado)\.$/ }),
    ).toBeVisible();

    await page.goto("/historial");
    await expect(page.getByText("Rigidez bastante").first()).toBeVisible();
  });

  test("blocks a second closeout for a date that is already closed", async ({ page }) => {
    await ensureAuthenticated(page);
    const closedDate = addRecoveryDays(getRecoveryDateKey(), -2);
    await page.getByLabel("Fecha y hora del cierre").fill(`${closedDate}T22:00`);
    await page.getByRole("slider", { name: "Dolor" }).fill("2");
    await page.getByText("Media", { exact: true }).click();
    await page.getByText("Nada", { exact: true }).click();
    await page.getByText("Regular", { exact: true }).click();
    await page.getByRole("button", { name: "Cerrar el dia" }).click();
    await expect(
      page.getByRole("heading", { name: /^(Dia cerrado|Cierre guardado)\.$/ }),
    ).toBeVisible();

    await ensureAuthenticated(page);
    await page.getByLabel("Fecha y hora del cierre").fill(`${closedDate}T22:00`);

    await expect(
      page.getByText("Ese día ya tiene un cierre registrado. Elige otra fecha."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar el dia" })).toBeDisabled();
  });

  test("keeps save disabled until every required closeout step is complete", async ({ page }) => {
    await ensureAuthenticated(page);

    const saveButton = page.getByRole("button", { name: "Cerrar el dia" });
    await expect(saveButton).toBeDisabled();
    await page.getByRole("slider", { name: "Dolor" }).fill("4");
    await page.getByText("Baja", { exact: true }).click();
    await page.getByText("Nada", { exact: true }).click();
    await expect(saveButton).toBeDisabled();
    await page.getByText("Mala", { exact: true }).click();
    await expect(saveButton).toBeEnabled();
  });

  test("rejects a future date on the server without losing entered values", async ({ page }) => {
    await ensureAuthenticated(page);
    const futureDate = addRecoveryDays(getRecoveryDateKey(), 1);
    await page.getByRole("slider", { name: "Dolor" }).fill("4");
    await page.getByText("Alta", { exact: true }).click();
    await page.getByText("Leve", { exact: true }).click();
    await page.getByText("Buena", { exact: true }).click();
    const note = page.getByPlaceholder("Lo que quieras dejar escrito antes de dormir...");
    await note.fill("Conservar el cierre si la fecha es rechazada.");
    // The picker's max blocks this in the browser; drop it to prove the server rejects it too.
    await page.locator('input[name="closedAt"]').evaluate((input, value) => {
      const dateInput = input as HTMLInputElement;
      dateInput.removeAttribute("max");
      dateInput.value = value;
    }, `${futureDate}T22:00`);
    await page.getByRole("button", { name: "Cerrar el dia" }).click();

    await expect(page.locator(".rr-session-error")).toContainText(
      "No puedes registrar un cierre con una fecha futura",
    );
    await expect(page.getByRole("slider", { name: "Dolor" })).toHaveValue("4");
    await expect(note).toHaveValue("Conservar el cierre si la fecha es rechazada.");
  });
});
