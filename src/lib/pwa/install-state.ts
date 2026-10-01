export type InstallState = "installed" | "ios" | "other";

interface InstallEnvironment {
  userAgent: string;
  maxTouchPoints: number;
  /** display-mode: standalone, or Safari's navigator.standalone. */
  standalone: boolean;
}

// Whether the app runs from the home screen, or else whether this is an iPhone/iPad (where push
// only works once installed). iPadOS reports itself as a Mac; touch support tells them apart.
export function getInstallState({ userAgent, maxTouchPoints, standalone }: InstallEnvironment): InstallState {
  if (standalone) return "installed";
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

export function readBrowserInstallState(): InstallState {
  return getInstallState({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  });
}
