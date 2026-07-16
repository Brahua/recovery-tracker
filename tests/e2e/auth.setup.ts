import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("authenticated storage state is available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Vuelve mas fuerte." })).toBeVisible();
  await page.getByRole("button", { name: "Explorar en modo demo" }).click();
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
