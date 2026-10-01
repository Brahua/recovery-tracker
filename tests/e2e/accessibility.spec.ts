import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

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

// Automated WCAG 2.1 A/AA checks with axe on every main screen, so the accessibility
// verified by hand (Lighthouse 100) does not regress silently.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    targets: nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary).toEqual([]);
}

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
  await exerciseDialog(page).getByLabel(/Duración total/).fill("10");
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

  test.describe("signed out", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("landing has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Vuelve mas fuerte." })).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });
});
