"use client";

import { useEffect } from "react";

// Registers public/sw.js for the whole app (also the landing, so the offline page is cached before
// sign-in). Renders nothing.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Service worker registration failed", error));
  }, []);

  return null;
}
