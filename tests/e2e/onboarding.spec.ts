import { expect, test, type Browser } from "@playwright/test";

import { expectNoAxeViolations } from "./axe-helpers";

// First-run tour (/bienvenida). Each test signs in a fresh anonymous user, who has not seen it.
async function newUser(browser: Browser) {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar en modo demo" }).click();
  await expect(page).toHaveURL(/\/bienvenida$/);
  return { context, page };
}

test.describe("onboarding", () => {
  test("a new account walks the tour, sets itself up and lands on Hoy", async ({ browser }) => {
    const { context, page } = await newUser(browser);
    const name = `Ana ${Date.now().toString(36).slice(-4)}`;

    await expect(
      page.getByRole("heading", { name: "Te damos la bienvenida a tu ritual" }),
    ).toBeVisible();
    await expect(page.getByText("Paso 1 de 6")).toBeAttached();
    await expectNoAxeViolations(page);

    // Other app screens send the new account back here until it finishes.
    await page.goto("/historial");
    await expect(page).toHaveURL(/\/bienvenida$/);

    for (let step = 1; step < 6; step += 1) {
      await page.getByRole("button", { name: "Siguiente" }).click();
      await expect(page.getByText(`Paso ${step + 1} de 6`)).toBeAttached();
    }
    await page.getByRole("button", { name: "Configurar" }).click();

    await expect(page.getByRole("heading", { name: "Déjala a tu gusto" })).toBeFocused();
    await page.getByLabel("¿Cómo quieres que te llamemos?").fill(name);
    await page.getByRole("radio", { name: "Claro", exact: true }).check();
    await page.getByRole("radio", { name: "Ámbar", exact: true }).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("button", { name: "Empezar" })).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Empezar" }).click();

    await expect(page.getByRole("heading", { name: `Hola, ${name}` })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "amber");

    // Done: /bienvenida no longer shows the first-run tour.
    await page.goto("/bienvenida");
    await expect(page).toHaveURL(/\/$/);
    await context.close();
  });

  test("skipping goes straight to Hoy and the tour can be replayed", async ({ browser }) => {
    const { context, page } = await newUser(browser);

    await page.getByRole("button", { name: "Saltar" }).click();
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();

    await page.goto("/bienvenida?recorrido=1");
    await expect(page.getByRole("heading", { name: "Cómo funciona la app" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(page).toHaveURL(/\/ajustes$/);
    await context.close();
  });
});
