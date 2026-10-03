// Demo profiles (docs/specs/demo-mode-spec.md). Each one is a real Supabase account that the
// landing's "Modo demo" signs into on the server. This file has no imports on purpose: the reset
// script (scripts/demo/reset-demo.mjs) loads it with plain `node`, and the app uses it for the
// picker and for the banner.

export const demoProfileIds = ["knee", "ankle", "shoulder"] as const;

export type DemoProfileId = (typeof demoProfileIds)[number];

export interface DemoProfile {
  id: DemoProfileId;
  /** Name of the card in the picker. */
  title: string;
  /** Short injury line under the title. */
  injury: string;
  /** One sentence about what the visitor will find. */
  summary: string;
  /** Name the greeting uses ("Hola, Camila"). */
  displayName: string;
  email: string;
  condition: {
    zone: "KNEE" | "ANKLE_FOOT" | "SHOULDER";
    side: "LEFT" | "RIGHT";
    kind: "SURGERY" | "INJURY";
    /** How many days before today the surgery or the injury happened. */
    startedDaysAgo: number;
  };
}

// The domain is a subdomain with no mail server: nobody can receive mail there or sign in with
// Google as one of these addresses, so the only way into the accounts is the server action.
const demoEmailDomain = "demo.recovery-tracker.brahua.com";

export const demoProfiles: Record<DemoProfileId, DemoProfile> = {
  knee: {
    id: "knee",
    title: "Post artroscopia de rodilla",
    injury: "Rodilla izquierda · operada hace 8 semanas",
    summary: "Fisio dos veces por semana, fuerza de cuádriceps y bicicleta. Va bajando el dolor.",
    displayName: "Camila",
    email: `demo-rodilla@${demoEmailDomain}`,
    condition: { zone: "KNEE", side: "LEFT", kind: "SURGERY", startedDaysAgo: 54 },
  },
  ankle: {
    id: "ankle",
    title: "Esguince grado III de tobillo",
    injury: "Tobillo derecho · lesión hace 6 semanas",
    summary: "Salió de la bota, trabaja movilidad, banda y equilibrio. Hay días con hinchazón.",
    displayName: "Diego",
    email: `demo-tobillo@${demoEmailDomain}`,
    condition: { zone: "ANKLE_FOOT", side: "RIGHT", kind: "INJURY", startedDaysAgo: 41 },
  },
  shoulder: {
    id: "shoulder",
    title: "Lesión del manguito rotador",
    injury: "Hombro derecho · desde hace 11 semanas",
    summary: "Tratamiento conservador: movilidad, banda elástica y noches que mejoran poco a poco.",
    displayName: "Lucía",
    email: `demo-hombro@${demoEmailDomain}`,
    condition: { zone: "SHOULDER", side: "RIGHT", kind: "INJURY", startedDaysAgo: 76 },
  },
};

export function isDemoProfileId(value: unknown): value is DemoProfileId {
  return typeof value === "string" && (demoProfileIds as readonly string[]).includes(value);
}

/** The demo marker lives in app_metadata, which users cannot edit (user_metadata they can). */
export function getDemoProfileId(
  appMetadata: Record<string, unknown> | null | undefined,
): DemoProfileId | null {
  const id = appMetadata?.demo_profile;
  return isDemoProfileId(id) ? id : null;
}
