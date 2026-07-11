import { existsSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

function uniqueLabel(prefix: string) {
  return `${prefix} ${Date.now()}`;
}

async function ensureAuthenticated(page: Page) {
  await page.goto("/");

  if (await page.getByRole("button", { name: "Entrar anonimo para pruebas" }).isVisible()) {
    await page.getByRole("button", { name: "Entrar anonimo para pruebas" }).click();
  }

  await expect(
    page.getByRole("heading", { name: "Registra como respondio la rodilla hoy" }),
  ).toBeVisible();
}

test.describe("post-therapy check-in", () => {
  test.skip(
    !existsSync("playwright/.auth/user.json"),
    "Missing authenticated Playwright storage state. Run `npm run e2e` once so setup can create it.",
  );

  test("saves a session with shortcuts and keeps it visible after reload", async ({
    page,
  }) => {
    await ensureAuthenticated(page);

    const customName = uniqueLabel("Prensa");

    await page.getByLabel("Dolor antes").selectOption("4");
    await page.getByLabel("Dolor durante").selectOption("5");
    await page.getByLabel("Dolor despues").selectOption("3");
    await page.getByLabel("Carga percibida").selectOption("3");
    await page.getByLabel("Bicicleta 5-10 min").check();
    await page.getByLabel("Step-up").check();
    await page.getByLabel("Como terminaste").selectOption("BETTER");
    await page.getByLabel("Nota corta opcional").fill("Sesion automatizada con shortcuts.");

    await page.getByRole("button", { name: "Guardar sesion" }).click();

    await expect(page.getByText("Sesion guardada.")).toBeVisible();
    await expect(page.getByText("Bicicleta 5-10 min, Step-up")).toBeVisible();

    await page.reload();

    await expect(page.getByText("Bicicleta 5-10 min, Step-up")).toBeVisible();

    await page.getByLabel("Dolor antes").selectOption("2");
    await page.getByLabel("Dolor durante").selectOption("");
    await page.getByLabel("Dolor despues").selectOption("2");
    await page.getByLabel("Carga percibida").selectOption("2");
    await page.getByLabel("Bicicleta 5-10 min").uncheck();
    await page.getByLabel("Step-up").uncheck();
    await page.getByLabel("Nombre").fill(customName);
    await page.getByLabel("Series").fill("3");
    await page.getByLabel("Reps").fill("12");
    await page.getByRole("spinbutton", { name: "Peso" }).fill("20");
    await page.getByLabel("Como terminaste").selectOption("SAME");
    await page.getByLabel("Nota corta opcional").fill("Sesion automatizada con ejercicio libre.");

    await page.getByRole("button", { name: "Guardar sesion" }).click();

    await expect(page.getByText("Sesion guardada.")).toBeVisible();
    await expect(page.getByText(customName)).toBeVisible();

    await page.reload();

    await expect(page.getByText(customName)).toBeVisible();
  });

  test("shows a validation error when no exercise is selected", async ({ page }) => {
    await ensureAuthenticated(page);

    await page.getByLabel("Dolor antes").selectOption("3");
    await page.getByLabel("Dolor durante").selectOption("");
    await page.getByLabel("Dolor despues").selectOption("3");
    await page.getByLabel("Carga percibida").selectOption("2");
    await page.getByLabel("Como terminaste").selectOption("SAME");
    await page.getByLabel("Nota corta opcional").fill("Debe fallar sin ejercicios.");
    await page.getByLabel("Nombre").fill("");
    await page.getByLabel("Series").fill("");
    await page.getByLabel("Reps").fill("");
    await page.getByRole("spinbutton", { name: "Peso" }).fill("");

    await page.getByRole("button", { name: "Guardar sesion" }).click();

    await expect(page.getByText("No se guardo la sesion.")).toBeVisible();
  });
});
