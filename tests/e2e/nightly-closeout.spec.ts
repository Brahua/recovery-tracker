import { expect, test } from "@playwright/test";

import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

import { insertLegacyCloseout } from "./admin-helpers";

// The morning check-in replaced the nightly closeout: the app no longer creates closeouts, but the
// ones saved before keep showing (and can be corrected, see edit-records.spec.ts).
test.describe("older nightly closeouts", () => {
  test("still show in Historial with their stiffness", async ({ page, context }) => {
    // Its own day block, far from the other specs' dates.
    const date = addRecoveryDays(getRecoveryDateKey(), -(500 + test.info().workerIndex * 5));
    const closeoutId = await insertLegacyCloseout(context, date, {
      endOfDayPain: 4,
      stiffnessLevel: "MODERATE",
    });

    await page.goto(getHistoryHrefForDate(date));
    const card = page.locator(`[data-closeout-id="${closeoutId}"]`);
    await expect(card.getByText("Rigidez bastante")).toBeVisible();
    await expect(card.getByText("Dolor final 4/10")).toBeVisible();
  });

  test("Registrar no longer offers the closeout", async ({ page }) => {
    await page.goto("/registrar?mode=session");
    await expect(page.getByRole("link", { name: "Cierre del dia" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Mañana" })).toBeVisible();
  });
});
