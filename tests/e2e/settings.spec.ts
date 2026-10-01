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

    // The toast stays a compact card at the top: it once stretched over the whole screen on iOS.
    const toastBox = await toast(page, "Nombre guardado").boundingBox();
    expect(toastBox?.height).toBeLessThan(120);
    expect(toastBox?.y).toBeLessThan(100);

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

  test("saves reminder switches and times", async ({ page }) => {
    await page.goto("/ajustes");
    await expect(page.getByRole("heading", { name: "Recordatorios" })).toBeVisible();
    // CI has no VAPID keys, so this device cannot subscribe; the schedule still saves.
    await expect(page.getByText("Las notificaciones todavía no están configuradas en el servidor.")).toBeVisible();

    const session = page.getByRole("switch", { name: "Sesión del día" });
    const closeout = page.getByRole("switch", { name: "Cierre nocturno" });
    const sessionTime = page.getByLabel("Hora del recordatorio de sesión del día");

    await session.check();
    await sessionTime.fill("07:30");
    await closeout.uncheck();
    await page.getByRole("button", { name: "Guardar recordatorios" }).click();
    await expect(toast(page, "Recordatorios guardados")).toBeVisible();

    await page.reload();
    await expect(session).toBeChecked();
    await expect(sessionTime).toHaveValue("07:30");
    await expect(closeout).not.toBeChecked();
    await expect(page.getByLabel("Hora del recordatorio de cierre nocturno")).toBeDisabled();

    await closeout.check();
    await page.getByRole("button", { name: "Guardar recordatorios" }).click();
    await expect(toast(page, "Recordatorios guardados")).toBeVisible();
  });
});
