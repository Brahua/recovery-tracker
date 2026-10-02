import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./axe-helpers";
import { toast } from "./exercise-helpers";

// Ajustes → Apariencia: theme and accent apply at once, survive a reload (account + cookie) and
// every main screen keeps WCAG AA with each accent and in the light theme.
const SCREENS = [
  "/",
  "/registrar?mode=session",
  "/registrar?mode=closeout",
  "/historial",
  "/insights",
  "/reporte",
  "/ajustes",
  "/ejercicios",
  "/ejercicios/rutinas/nueva",
] as const;

async function choose(page: Page, label: string) {
  await page.goto("/ajustes");
  const section = page.getByRole("region", { name: "Apariencia" });
  const radio = section.getByRole("radio", { name: label, exact: true });
  if (await radio.isChecked()) return;
  await radio.check();
  await expect(toast(page, "Apariencia guardada")).toBeVisible();
}

async function expectAccessibleScreens(page: Page, attribute: string, value: string) {
  for (const path of SCREENS) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute(attribute, value);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByTestId("global-progress")).not.toHaveClass(/is-active/);
    await expectNoAxeViolations(page);
  }
}

test.describe.serial("appearance", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: "playwright/.auth/user.json" });
    const page = await context.newPage();
    await choose(page, "Verde");
    await choose(page, "Oscuro");
    await context.close();
  });

  test("the accent applies at once and persists after a reload", async ({ page }) => {
    await choose(page, "Ámbar");
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
      await choose(page, "Oscuro");
      await choose(page, label);
      await expectAccessibleScreens(page, "data-accent", accent);
    });
  }

  for (const [label, accent] of [
    ["Verde", "green"],
    ["Terracota", "terracotta"],
    ["Ámbar", "amber"],
  ] as const) {
    test(`light theme has no WCAG A/AA violations with ${accent}`, async ({ page }) => {
      await choose(page, "Claro");
      await choose(page, label);
      await expect(page.locator("html")).toHaveAttribute("data-accent", accent);
      await expectAccessibleScreens(page, "data-theme", "light");
    });
  }

  test("Sistema follows the device: light when the phone is in light mode", async ({ page }) => {
    await choose(page, "Verde");
    await choose(page, "Sistema");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
    const htmlBackground = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(await htmlBackground()).toBe("rgb(246, 242, 235)");

    await page.emulateMedia({ colorScheme: "dark" });
    expect(await htmlBackground()).toBe("rgb(14, 12, 10)");
  });

  test("the signed-out landing stays dark in the light theme", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    await context.addCookies([{ name: "rr-appearance", value: "light.green", url: baseURL! }]);
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const landingBackground = await page
      .locator(".rr-landing-shell")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(landingBackground).toBe("rgb(14, 12, 10)");
    await expectNoAxeViolations(page);
    await context.close();
  });
});
