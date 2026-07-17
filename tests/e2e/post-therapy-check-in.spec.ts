import { expect, test, type Page } from "@playwright/test";

async function ensureAuthenticated(page: Page) {
  await page.goto("/registrar?mode=session");
  await expect(page.getByRole("heading", { name: "Registrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sesion" })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

test.describe("post-therapy check-in", () => {
  test("saves a session and keeps its summary visible after reload", async ({ page }) => {
    await ensureAuthenticated(page);

    await page.getByRole("slider", { name: "Antes" }).fill("4");
    await page.getByRole("slider", { name: "Durante" }).fill("5");
    await page.getByRole("slider", { name: "Despues" }).fill("3");
    await page.getByText("Media", { exact: true }).click();
    await page.getByText("Bicicleta 5-10 min", { exact: true }).click();
    await page.getByText("Step-up", { exact: true }).click();

    const bicycle = page
      .locator(".rr-exercise-detail")
      .filter({ hasText: "Bicicleta 5-10 min" });
    await bicycle.getByLabel(/Duración total/).fill("12.5");
    await bicycle.getByLabel(/Distancia total/).fill("4.2");

    const stepUp = page
      .locator(".rr-exercise-detail")
      .filter({ hasText: "Step-up" });
    await stepUp.getByRole("button", { name: "+ Añadir serie" }).click();
    await stepUp.getByLabel("Repeticiones").fill("12");
    await stepUp.getByLabel(/^Peso/).fill("10");
    await stepUp.getByRole("button", { name: "Duplicar serie 1" }).click();
    await stepUp.getByLabel("Repeticiones").nth(1).fill("8");
    await stepUp.getByLabel(/^Peso/).nth(1).fill("12.5");
    await page.getByText("Mejor que antes", { exact: true }).click();
    await page.getByRole("button", { name: "Añadir nota" }).click();
    await page
      .getByPlaceholder("Algo que quieras recordar...")
      .fill("Sesion automatizada con shortcuts.");

    await page.getByRole("button", { name: "Guardar sesion" }).click();

    await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();
    const summary = page.getByLabel("Resumen de la sesion");
    await expect(summary.getByText("Fisio guiada")).toBeVisible();
    await expect(summary.getByText("2", { exact: true })).toBeVisible();
    await expect(summary.getByText("4 → 3")).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();
    await expect(page.getByLabel("Resumen de la sesion").getByText("4 → 3")).toBeVisible();
  });

  test("keeps save disabled until every required session step is complete", async ({ page }) => {
    await ensureAuthenticated(page);

    const saveButton = page.getByRole("button", { name: "Guardar sesion" });
    await expect(saveButton).toBeDisabled();
    await page.getByRole("slider", { name: "Durante" }).fill("3");
    await page.getByRole("slider", { name: "Despues" }).fill("3");
    await page.getByText("Igual", { exact: true }).click();
    await page.getByText("TKE", { exact: true }).click();
    await expect(saveButton).toBeDisabled();
    await expect(saveButton).toContainText("faltan 1");
    const tke = page.locator(".rr-exercise-detail").filter({ hasText: "TKE" });
    await tke.getByRole("button", { name: "+ Añadir serie" }).click();
    await tke.getByLabel("Repeticiones").fill("12");
    await expect(saveButton).toBeEnabled();
  });
});
