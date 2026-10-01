import { expect, test, type Page } from "@playwright/test";

import {
  addQuickExercise,
  closeExerciseDialog,
  exerciseDialog,
  fillSessionBasics,
  openSessionForm,
  saveSession,
  sessionExerciseRow,
  uniqueName,
} from "./exercise-helpers";

function treatmentsCard(page: Page) {
  return page.getByRole("region", { name: "Tratamientos del centro" });
}

function treatmentGroup(page: Page, name: string) {
  return treatmentsCard(page).getByRole("group", { name });
}

function treatmentRows(page: Page) {
  return treatmentsCard(page).getByRole("list", { name: "Tratamientos aplicados" }).getByRole("listitem");
}

test.describe("physio treatments", () => {
  test("saves a physio session with only treatments and shows them in history and Today", async ({ page }) => {
    const otherName = uniqueName("Indiba");
    const instructions = uniqueName("Bajar carga en sentadilla");

    await openSessionForm(page);
    await fillSessionBasics(page);
    await expect(page.getByRole("heading", { name: "Ejercicios o tratamientos" })).toBeVisible();

    await treatmentGroup(page, "Agentes físicos").getByRole("button", { name: "Ondas de choque" }).click();
    await expect(
      treatmentGroup(page, "Agentes físicos").getByRole("button", { name: "Ondas de choque" }),
    ).toHaveAttribute("aria-pressed", "true");
    await treatmentRows(page).nth(0).getByLabel("Zona").fill("Tendón rotuliano");
    await treatmentRows(page).nth(0).getByLabel("Min").fill("10");

    await treatmentGroup(page, "Vendaje").getByRole("button", { name: "Kinesiotape" }).click();
    await expect(treatmentRows(page).nth(1).getByLabel("Min")).toHaveCount(0);

    await treatmentGroup(page, "Terapia manual").getByRole("button", { name: "+ Otro" }).click();
    await expect(treatmentRows(page).nth(2)).toContainText("Escribe qué tratamiento fue.");
    await expect(page.getByRole("button", { name: /Guardar sesion/ })).toBeDisabled();
    await treatmentRows(page).nth(2).getByLabel("Nombre").fill(otherName);

    await treatmentsCard(page).getByLabel("Indicaciones del fisio (opcional)").fill(instructions);
    await expect(page.getByRole("button", { name: /Guardar sesion/ })).toContainText(
      "0 ejercicios · 3 tratamientos",
    );
    const sessionId = await saveSession(page);

    await page.goto("/");
    const notesCard = page.getByRole("region", { name: "Indicaciones del fisio" });
    await expect(notesCard).toContainText(instructions);

    await page.goto("/historial");
    const session = page.locator(`[data-session-id="${sessionId}"]`);
    const toggle = session.getByRole("button").first();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    const treatments = session.getByRole("region", { name: "Tratamientos" });
    await expect(treatments).toContainText("Ondas de choque · Tendón rotuliano · 10 min");
    await expect(treatments).toContainText("Kinesiotape");
    await expect(treatments).toContainText(otherName);
    await expect(session).toContainText(instructions);
    await expect(session).not.toContainText("Sin ejercicios detallados.");
  });

  test("hides treatments for other session types and does not send them", async ({ page }) => {
    await openSessionForm(page);
    await fillSessionBasics(page);
    await treatmentGroup(page, "Agentes físicos").getByRole("button", { name: "Láser" }).click();

    await page.getByText("En casa", { exact: true }).click();
    await expect(treatmentsCard(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Ejercicios", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Guardar sesion/ })).toBeDisabled();

    await addQuickExercise(page, "Bicicleta 5-10 min");
    await sessionExerciseRow(page, "Bicicleta 5-10 min").click();
    await exerciseDialog(page).getByLabel(/Duración total/).fill("10");
    await closeExerciseDialog(page);
    await expect(page.getByRole("button", { name: /Guardar sesion/ })).toBeEnabled();
    const sessionId = await saveSession(page);

    await page.goto("/historial");
    const session = page.locator(`[data-session-id="${sessionId}"]`);
    const toggle = session.getByRole("button").first();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
    }
    await expect(session.getByRole("region", { name: "Tratamientos" })).toHaveCount(0);
  });
});
