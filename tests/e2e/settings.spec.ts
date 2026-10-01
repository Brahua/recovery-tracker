import { expect, test } from "@playwright/test";

import { toast } from "./exercise-helpers";

// Ajustes → Perfil: the chosen name replaces the greeting in Hoy; clearing it falls back.
test.describe("settings", () => {
  test("changes the name the app greets you with, and clears it", async ({ page }) => {
    const name = `Ritual ${Date.now().toString(36).slice(-4)}`;

    await page.goto("/ajustes");
    await expect(page.getByRole("heading", { name: "Ajustes", level: 1 })).toBeVisible();

    const field = page.getByLabel("¿Cómo quieres que te llamemos?");
    await field.fill(name);
    await page.getByRole("button", { name: "Guardar nombre" }).click();
    await expect(toast(page, "Nombre guardado")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: `Hola, ${name}` })).toBeVisible();

    await page.goto("/ajustes");
    await expect(field).toHaveValue(name);
    await field.fill("");
    await page.getByRole("button", { name: "Guardar nombre" }).click();
    await expect(toast(page, "Usaremos el nombre de tu cuenta")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: `Hola, ${name}` })).toHaveCount(0);
  });

  test("is reachable from the profile area", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ajustes" }).first().click();
    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.getByRole("heading", { name: "Instalar en tu celular" })).toBeVisible();
  });
});
