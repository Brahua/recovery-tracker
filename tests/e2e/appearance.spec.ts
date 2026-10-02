import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./axe-helpers";
import { toast } from "./exercise-helpers";

// Ajustes → Apariencia: the accent applies at once, survives a reload (account + cookie) and every
// main screen keeps WCAG AA with each accent.
const SCREENS = [
  "/",
  "/registrar?mode=session",
  "/registrar?mode=closeout",
  "/historial",
  "/insights",
  "/reporte",
  "/ajustes",
] as const;

async function chooseAccent(page: Page, label: string) {
  await page.goto("/ajustes");
  const section = page.getByRole("region", { name: "Apariencia" });
  await section.getByRole("radio", { name: label }).check();
  await expect(toast(page, "Apariencia guardada")).toBeVisible();
}

test.describe.serial("appearance", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: "playwright/.auth/user.json" });
    const page = await context.newPage();
    await chooseAccent(page, "Verde");
    await context.close();
  });

  test("the accent applies at once and persists after a reload", async ({ page }) => {
    await chooseAccent(page, "Ámbar");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "amber");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "amber");
    await expect(
      page.getByRole("region", { name: "Apariencia" }).getByRole("radio", { name: "Ámbar" }),
    ).toBeChecked();

    // The account is the source of truth: without the cookie, the layout restores it.
    await page.context().clearCookies({ name: "rr-appearance" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "amber");
  });

  for (const [label, accent] of [
    ["Terracota", "terracotta"],
    ["Ámbar", "amber"],
  ] as const) {
    test(`main screens have no WCAG A/AA violations with ${accent}`, async ({ page }) => {
      await chooseAccent(page, label);
      for (const path of SCREENS) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-accent", accent);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        await expect(page.getByTestId("global-progress")).not.toHaveClass(/is-active/);
        await expectNoAxeViolations(page);
      }
    });
  }
});
