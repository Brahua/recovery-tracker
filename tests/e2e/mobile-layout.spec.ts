import { expect, test, type Locator, type Page } from "@playwright/test";

import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function expectAboveTabBar(page: Page, action: Locator) {
  const tabBar = page.getByRole("navigation", { name: "Navegacion principal movil" });
  await expect(tabBar).toBeVisible();
  await expect(action).toBeVisible();

  const [actionBox, tabBarBox] = await Promise.all([action.boundingBox(), tabBar.boundingBox()]);
  expect(actionBox).not.toBeNull();
  expect(tabBarBox).not.toBeNull();
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(tabBarBox!.y);

  // The element actually receives taps at its center (nothing is painted on top).
  const receivesTap = await action.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit !== null && element.contains(hit);
  });
  expect(receivesTap).toBe(true);
}

test.describe("mobile fixed action bars", () => {
  test("session save button sits above the tab bar", async ({ page }) => {
    await page.goto("/registrar?mode=session");
    await expectAboveTabBar(page, page.getByRole("button", { name: /Guardar sesion/ }));
  });

  test("closeout save button sits above the tab bar", async ({ page }) => {
    const pastDate = addRecoveryDays(getRecoveryDateKey(), -400);
    await page.goto(`/registrar?mode=closeout&date=${pastDate}`);
    await expectAboveTabBar(page, page.getByRole("button", { name: /Cerrar el dia/ }));
  });

  test("report actions sit above the tab bar", async ({ page }) => {
    await page.goto("/reporte");
    await expectAboveTabBar(page, page.getByRole("button", { name: /Compartir reporte|Enlace copiado/ }));
  });
});
