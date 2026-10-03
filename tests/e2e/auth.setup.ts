import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

// One anonymous user for the whole run. It skips the first-run tour (/bienvenida) so every spec
// starts on Hoy; tests/e2e/onboarding.spec.ts covers the tour with fresh users.
test("authenticated storage state is available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Vuelve mas fuerte." })).toBeVisible();
  await page.getByRole("button", { name: "Sesión de prueba anónima" }).click();
  await expect(page).toHaveURL(/\/bienvenida$/);
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
