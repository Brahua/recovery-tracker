import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe-helpers";

// The sign-in itself needs the demo accounts that scripts/demo/reset-demo.mjs creates in the hosted
// project, so E2E (throwaway local database) only covers the picker.
test.describe("demo mode picker", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the landing offers three demo patients in a modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Modo demo/ }).click();

    const dialog = page.getByRole("dialog", { name: "Modo demo" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Post artroscopia de rodilla/ })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /Esguince grado III de tobillo/ }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Lesión del manguito rotador/ })).toBeVisible();
    await expectNoAxeViolations(page);

    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await expect(dialog).toBeHidden();
  });
});
