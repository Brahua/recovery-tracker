// Renders src/design-system/brand/app-icon.svg to the PNG icons the PWA needs.
// Run after changing the SVG: `node scripts/pwa/render-icons.mjs`, then commit the PNGs.
// Uses Playwright's Chromium (already a dev dependency) to rasterize the SVG.
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const svg = readFileSync("src/design-system/brand/app-icon.svg", "utf8");
const OUTPUTS = [
  { size: 192, file: "public/icons/icon-192.png" },
  { size: 512, file: "public/icons/icon-512.png" },
  // Maskable: same art; the mark already sits inside the 80% safe zone.
  { size: 512, file: "public/icons/icon-maskable-512.png" },
  // iOS home screen (Next serves src/app/apple-icon.png as <link rel="apple-touch-icon">).
  { size: 180, file: "src/app/apple-icon.png" },
  // Browser tab icon (Next serves src/app/icon.png as <link rel="icon">).
  { size: 64, file: "src/app/icon.png" },
];

const browser = await chromium.launch();
try {
  for (const { size, file } of OUTPUTS) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg.replace(
        "<svg ",
        `<svg style="display:block;width:${size}px;height:${size}px" `,
      )}</body></html>`,
    );
    await page.screenshot({ path: file, omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    console.log(`${file} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
