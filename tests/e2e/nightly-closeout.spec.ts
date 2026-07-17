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
    await page.getByRole("button", { name: /cambiar/i }).click();
    const dateInput = page.getByRole("textbox", { name: "Fecha del cierre" });
    await expect(dateInput).toHaveAttribute("max", getRecoveryDateKey());
    await dateInput.fill(yesterday);
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
    await expect(page.getByText("Cierre del dia")).toBeVisible();
    await expect(page.getByText("dolor 3")).toBeVisible();
    await expect(page.getByText(/^Ayer · registrado/)).toBeVisible();

    await page.reload();

    await expect(page.getByText("Cierre del dia")).toBeVisible();
    await expect(page.getByText("dolor 3")).toBeVisible();
  });

  test("blocks a second closeout for a date that is already closed", async ({ page }) => {
    await ensureAuthenticated(page);
    const closedDate = addRecoveryDays(getRecoveryDateKey(), -2);
    await page.getByRole("button", { name: /cambiar/i }).click();
    await page.getByRole("textbox", { name: "Fecha del cierre" }).fill(closedDate);
    await page.getByRole("slider", { name: "Dolor" }).fill("2");
    await page.getByText("Media", { exact: true }).click();
    await page.getByText("Nada", { exact: true }).click();
    await page.getByText("Regular", { exact: true }).click();
    await page.getByRole("button", { name: "Cerrar el dia" }).click();
    await expect(
      page.getByRole("heading", { name: /^(Dia cerrado|Cierre guardado)\.$/ }),
    ).toBeVisible();

    await ensureAuthenticated(page);
    await page.getByRole("button", { name: /cambiar/i }).click();
    await page.getByRole("textbox", { name: "Fecha del cierre" }).fill(closedDate);

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
    const note = page.getByPlaceholder(
      "Lo que quieras dejar escrito antes de dormir...",
    );
    await note.fill("Conservar el cierre si la fecha es rechazada.");
    await page.locator('input[name="date"]').evaluate((input, value) => {
      (input as HTMLInputElement).value = value;
    }, futureDate);
    await page.getByRole("button", { name: "Cerrar el dia" }).click();

    await expect(page.locator(".rr-session-error")).toContainText(
      "No puedes registrar un cierre con una fecha futura",
    );
    await expect(page.getByRole("slider", { name: "Dolor" })).toHaveValue("4");
    await expect(note).toHaveValue("Conservar el cierre si la fecha es rechazada.");
  });
});
