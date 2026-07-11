import { existsSync } from "node:fs";

import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("authenticated storage state is available", async ({ page }) => {
  if (existsSync(authFile)) {
    test.skip();
  }

  await page.goto("/");
  await expect(page.getByText("Recovery Ritual")).toBeVisible();
  await page.getByRole("button", { name: "Entrar anonimo para pruebas" }).click();
  await expect(page.getByText("Sesion activa como")).toBeVisible();
  await page.context().storageState({ path: authFile });
});
