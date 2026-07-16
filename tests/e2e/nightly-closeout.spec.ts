import { expect, test, type Page } from "@playwright/test";

async function ensureAuthenticated(page: Page) {
  await page.goto("/registrar?mode=closeout");
  await expect(page.getByRole("heading", { name: "Registrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cierre" })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

test.describe("nightly closeout", () => {
  test("saves a closeout and keeps it visible after reload", async ({ page }) => {
    await ensureAuthenticated(page);
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
    await expect(page.getByText("Cierre nocturno")).toBeVisible();
    await expect(page.getByText("dolor 3")).toBeVisible();

    await page.reload();

    await expect(page.getByText("Cierre nocturno")).toBeVisible();
    await expect(page.getByText("dolor 3")).toBeVisible();
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
});
