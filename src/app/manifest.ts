import type { MetadataRoute } from "next";

// Same values as --rr-bg in src/design-system/styles/tokens/colors.css (the app is dark only).
export const APP_BACKGROUND = "#0e0c0a";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Recovery Tracker",
    short_name: "Recovery",
    description:
      "Tu ritual diario de recuperacion de rodilla: sesiones, cierres, insights y reporte.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: APP_BACKGROUND,
    theme_color: APP_BACKGROUND,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
