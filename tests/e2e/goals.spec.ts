import { expect, test } from "@playwright/test";

import { toast } from "./exercise-helpers";

// Hoy → Mis metas: write a goal, tick it off, see it in the Reporte, remove it. The E2E user is
// shared by every spec, so the goal is removed at the end.
test.describe("goals", () => {
  test("adds, achieves and removes a goal", async ({ page }) => {
    const title = `Subir escaleras ${Date.now().toString(36).slice(-4)}`;

    await page.goto("/");
    const card = page.getByRole("region", { name: "Mis metas" });
    await card.getByLabel("Nueva meta").fill("ab");
    await card.getByRole("button", { name: "Agregar" }).click();
    await expect(card.getByRole("alert")).toHaveText("Escribe al menos 3 letras.");

    await card.getByLabel("Nueva meta").fill(title);
    await card.getByRole("button", { name: "Agregar" }).click();
    await expect(toast(page, "Meta agregada")).toBeVisible();
    await expect(card.getByText(title)).toBeVisible();

    await card.getByRole("button", { name: `Marcar como lograda: ${title}` }).click();
    await expect(toast(page, "¡Meta lograda! Un paso más.")).toBeVisible();
    await expect(card.getByText("1 lograda")).toBeVisible();

    await page.goto("/reporte");
    await expect(page.getByText(title).first()).toBeVisible();

    await page.goto("/");
    await card.getByText("Metas logradas").click();
    await card.getByRole("button", { name: `Quitar meta: ${title}` }).click();
    await expect(toast(page, "Meta quitada")).toBeVisible();
    await expect(card.getByText(title)).toHaveCount(0);
  });
});
