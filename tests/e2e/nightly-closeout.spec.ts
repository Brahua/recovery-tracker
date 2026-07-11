import { expect, test, type Page } from "@playwright/test";

async function ensureAuthenticated(page: Page) {
  await page.goto("/");

  if (await page.getByRole("button", { name: "Entrar anonimo para pruebas" }).isVisible()) {
    await page.getByRole("button", { name: "Entrar anonimo para pruebas" }).click();
  }

  await expect(
    page.getByRole("heading", { name: "Registra como termino el dia" }),
  ).toBeVisible();
}

test.describe("nightly closeout", () => {
  test("saves a closeout and keeps it visible after reload", async ({ page }) => {
    await ensureAuthenticated(page);
    const recentStatus = page.locator("#recent-status");

    const uniqueNote = `Cierre automatizado ${Date.now()}`;

    await page.getByLabel("Dolor final del dia").selectOption("3");
    await page.getByLabel("Energia").selectOption("4");
    await page.getByLabel("Horas de sueno").fill("7.5");
    await page.getByLabel("Calidad de sueno").selectOption("4");
    await page.getByLabel("Rebote desde la ultima sesion").selectOption("MILD");
    await page.getByLabel("Nota opcional").fill(uniqueNote);

    await page.getByRole("button", { name: "Guardar cierre" }).click();

    await expect(page.getByText("Cierre guardado.")).toBeVisible();
    await expect(recentStatus.getByText("Rebote: Leve")).toBeVisible();
    await expect(recentStatus.getByText("Sueno: 7.5 h")).toBeVisible();

    await page.reload();

    await expect(recentStatus.getByText("Rebote: Leve")).toBeVisible();
    await expect(recentStatus.getByText("Sueno: 7.5 h")).toBeVisible();
  });

  test("shows validation error for invalid sleep hours", async ({ page }) => {
    await ensureAuthenticated(page);

    await page.getByLabel("Dolor final del dia").selectOption("4");
    await page.getByLabel("Energia").selectOption("2");
    await page.getByLabel("Horas de sueno").fill("25");
    await page.getByLabel("Calidad de sueno").selectOption("2");
    await page.getByLabel("Rebote desde la ultima sesion").selectOption("NONE");
    await page.getByLabel("Nota opcional").fill("Debe fallar por horas invalidas.");

    await page.getByRole("button", { name: "Guardar cierre" }).click();

    await expect(page.getByText("No se guardo el cierre.")).toBeVisible();
  });
});
