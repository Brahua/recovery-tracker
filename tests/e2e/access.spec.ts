import { expect, test } from "@playwright/test";

import { setCurrentUserAdmin } from "./admin-helpers";
import { expectNoAxeViolations } from "./axe-helpers";
import { toast } from "./exercise-helpers";

// Ajustes → Acceso (ADR-005): only the admin sees it; invites go to the allowlist and can be removed.
test.describe.serial("access settings", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: "playwright/.auth/user.json" });
    await setCurrentUserAdmin(context, false);
    await context.close();
  });

  test("a regular user does not see the Acceso section", async ({ page }) => {
    await page.goto("/ajustes");
    await expect(page.getByRole("heading", { name: "Ajustes", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acceso" })).toHaveCount(0);
  });

  test("the admin invites an email, sees it pending and removes it", async ({ page, context }) => {
    await setCurrentUserAdmin(context, true);
    const email = `e2e-${Date.now().toString(36)}@gmail.com`;

    await page.goto("/ajustes");
    const section = page.getByRole("region", { name: "Acceso" });
    await expect(section).toBeVisible();
    await expect(section.getByText("Solo por invitación", { exact: true })).toBeVisible();

    await section.getByLabel("Invitar a alguien").fill("no-es-un-correo");
    await section.getByRole("button", { name: "Invitar" }).click();
    await expect(section.getByRole("alert")).toContainText("correo válido");

    await section.getByLabel("Invitar a alguien").fill(`  ${email.toUpperCase()} `);
    await section.getByRole("button", { name: "Invitar" }).click();
    await expect(toast(page, "Invitación agregada")).toBeVisible();

    const row = section.getByRole("listitem").filter({ hasText: email });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pendiente")).toBeVisible();
    await expect(
      row.getByRole("button", { name: `Compartir invitación con ${email}` }),
    ).toBeVisible();
    await expectNoAxeViolations(page);

    await row.getByRole("button", { name: `Quitar a ${email}` }).click();
    const dialog = page.getByRole("dialog", { name: "¿Quitar la invitación?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Quitar" }).click();
    await expect(toast(page, "Invitación quitada")).toBeVisible();
    await expect(section.getByRole("listitem").filter({ hasText: email })).toHaveCount(0);
  });

  test("the admin opens access and returns to invite-only", async ({ page, context }) => {
    await setCurrentUserAdmin(context, true);
    await page.goto("/ajustes");
    const section = page.getByRole("region", { name: "Acceso" });

    await section.getByRole("button", { name: "Abrir a cualquier cuenta de Google" }).click();
    await page
      .getByRole("dialog", { name: "¿Abrir el acceso?" })
      .getByRole("button", { name: "Abrir acceso" })
      .click();
    await expect(toast(page, "Acceso abierto a cualquier cuenta de Google")).toBeVisible();
    await expect(section.getByText("Abierto", { exact: true })).toBeVisible();

    await section.getByRole("button", { name: "Volver a solo por invitación" }).click();
    await page
      .getByRole("dialog", { name: "¿Volver a solo por invitación?" })
      .getByRole("button", { name: "Solo por invitación" })
      .click();
    await expect(toast(page, "Acceso solo por invitación")).toBeVisible();
    await expect(section.getByText("Solo por invitación", { exact: true })).toBeVisible();
  });
});
