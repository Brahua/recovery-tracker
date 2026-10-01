import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Installable app (manifest + icons), the service worker and the offline screen.
test.describe("PWA", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("serves a manifest whose icons exist", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: "Recovery Tracker",
      display: "standalone",
      start_url: "/",
    });

    for (const icon of manifest.icons as Array<{ src: string }>) {
      const image = await request.get(icon.src);
      expect(image.ok(), icon.src).toBe(true);
      expect(image.headers()["content-type"]).toContain("image/png");
    }

    expect((await request.get("/apple-icon.png")).ok()).toBe(true);
  });

  test("serves the service worker uncached", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("javascript");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("offline page is readable and accessible", async ({ page }) => {
    await page.goto("/offline.html");
    await expect(page.getByRole("heading", { name: "Sin conexion" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reintentar" })).toHaveAttribute("href", "/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map(({ id }) => id)).toEqual([]);
  });

  test("shows the offline page when a navigation fails without network", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
        );
      }
      return Boolean(registration.active);
    });

    await context.setOffline(true);
    try {
      await page.goto("/historial");
      await expect(page.getByRole("heading", { name: "Sin conexion" })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
