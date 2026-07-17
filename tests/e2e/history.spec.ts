import { expect, test } from "@playwright/test";

test.describe("read-only history", () => {
  test("shows a saved session with its individual sets and supports older windows", async ({ page }) => {
    await page.goto("/registrar?mode=session");
    await expect(page.getByRole("heading", { name: "Registrar" })).toBeVisible();

    await page.getByRole("slider", { name: "Durante" }).fill("3");
    await page.getByRole("slider", { name: "Despues" }).fill("2");
    await page.getByText("Media", { exact: true }).click();
    await page.getByText("Bicicleta 5-10 min", { exact: true }).click();
    await page.getByText("Step-up", { exact: true }).click();
    const bicycle = page.locator(".rr-exercise-detail").filter({ hasText: "Bicicleta 5-10 min" });
    await bicycle.getByLabel(/Duración total/).fill("12.5");
    await bicycle.getByLabel(/Distancia total/).fill("4.2");
    const exercise = page.locator(".rr-exercise-detail").filter({ hasText: "Step-up" });
    await exercise.getByRole("button", { name: "+ Añadir serie" }).click();
    await exercise.getByLabel("Repeticiones").fill("11");
    await exercise.getByLabel(/^Peso/).fill("7.5");
    await page.getByText("Mejor que antes", { exact: true }).click();
    await page.getByRole("button", { name: "Guardar sesion" }).click();
    await expect(page.getByRole("heading", { name: "Sesion hecha." })).toBeVisible();

    await page.getByRole("link", { name: "Ver historial", exact: true }).click();

    await expect(page).toHaveURL(/\/historial$/);
    await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
    const session = page.locator(".rr-history-event").filter({ hasText: "Step-up" }).first();
    await expect(session.getByText("Serie 1")).toBeVisible();
    await expect(session.getByText("11 rep")).toBeVisible();
    await expect(session.getByText("7.5 kg")).toBeVisible();
    const durationExercise = page.locator(".rr-history-event").filter({ hasText: "Bicicleta 5-10 min" }).first();
    await expect(durationExercise.getByText("12.5 min · 4.2 km")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver 30 dias anteriores" })).toHaveAttribute(
      "href",
      /before=\d{4}-\d{2}-\d{2}/,
    );
    await expect(page.getByRole("button", { name: /editar|eliminar/i })).toHaveCount(0);
  });
});
