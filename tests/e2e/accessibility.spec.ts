import { expect, test, type Page } from "@playwright/test";

import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

import { expectNoAxeViolations } from "./axe-helpers";
import {
  addExerciseFromCatalog,
  addQuickExercise,
  closeExerciseDialog,
  exerciseDialog,
  fillSessionBasics,
  openSessionForm,
  saveSession,
  sessionExerciseRow,
} from "./exercise-helpers";

const SIGNED_IN_SCREENS = [
  { name: "Hoy", path: "/", ready: /^Hola,/ },
  { name: "Registrar sesion", path: "/registrar?mode=session", ready: null },
  { name: "Cierre del dia", path: "/registrar?mode=closeout", ready: null },
  { name: "Historial", path: "/historial", ready: null },
  { name: "Insights", path: "/insights", ready: null },
  { name: "Reporte", path: "/reporte", ready: null },
  { name: "Ejercicios", path: "/ejercicios", ready: null },
  { name: "Nueva rutina", path: "/ejercicios/rutinas/nueva", ready: null },
  { name: "Ajustes", path: "/ajustes", ready: null },
] as const;

// Populated screens render far more than empty states (history rows, metrics, sets),
// so the suite logs its own session and closeout instead of relying on other specs.
async function seedRecoveryData(page: Page) {
  await openSessionForm(page);
  await fillSessionBasics(page);
  await addQuickExercise(page, "Bicicleta 5-10 min");
  await sessionExerciseRow(page, "Bicicleta 5-10 min").click();
  await exerciseDialog(page)
    .getByLabel(/Duración total/)
    .fill("10");
  await closeExerciseDialog(page);
  const exercise = await addExerciseFromCatalog(page, "step-u", "Step-up");
  await exercise.getByRole("button", { name: "+ Añadir serie" }).click();
  await exercise.getByLabel("Repeticiones").fill("10");
  await exercise.getByLabel(/^Peso/).fill("5");
  await closeExerciseDialog(page);
  await saveSession(page);

  // Inside Historial's 30-day window, on a day no other spec closes (they use -1 and -2).
  // Random so a CI retry of this serial block does not hit the one-closeout-per-day rule.
  const closeoutDate = addRecoveryDays(getRecoveryDateKey(), -(3 + Math.floor(Math.random() * 26)));
  await page.goto(`/registrar?mode=closeout&date=${closeoutDate}`);
  await page.getByRole("slider", { name: "Dolor" }).fill("4");
  await page.getByText("Alta", { exact: true }).click();
  await page.getByText("Leve", { exact: true }).click();
  await page.getByText("Buena", { exact: true }).click();
  await page.getByRole("button", { name: "Cerrar el dia" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Cierre guardado" })).toBeVisible();
}

test.describe.serial("accessibility (axe)", () => {
  // Entrance animations fade content in; axe would measure contrast mid-fade.
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("seed a session and a closeout", async ({ page }) => {
    await seedRecoveryData(page);
  });

  for (const screen of SIGNED_IN_SCREENS) {
    test(`${screen.name} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(screen.path);
      if (screen.ready) {
        await expect(page.getByRole("heading", { name: screen.ready })).toBeVisible();
      } else {
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
      await expect(page.getByTestId("global-progress")).not.toHaveClass(/is-active/);
      await expectNoAxeViolations(page);
    });
  }

  test("Registrar with physio treatments has no WCAG A/AA violations", async ({ page }) => {
    await openSessionForm(page);
    const treatments = page.getByRole("region", { name: "Tratamientos del centro" });
    await treatments.getByRole("button", { name: "Tecarterapia" }).click();
    await treatments
      .getByRole("group", { name: "Vendaje" })
      .getByRole("button", { name: "+ Otro" })
      .click();
    await expect(treatments.getByRole("listitem")).toHaveCount(2);
    await expectNoAxeViolations(page);
  });

  test.describe("signed out", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("landing has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Vuelve mas fuerte." })).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("invite-only rejection page has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/auth/auth-code-error?reason=not_invited");
      await expect(
        page.getByRole("heading", { name: "Recovery Ritual está en acceso por invitación." }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Intentar con otra cuenta" })).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
});
