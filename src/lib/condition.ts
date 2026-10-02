import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";

// The one active injury or condition of an account (docs/specs/general-rehab-spec.md). It lives in
// user_metadata.condition, so every page already has it with the user and it needs no query.

export const bodyZones = [
  "NECK",
  "SHOULDER",
  "ELBOW",
  "WRIST_HAND",
  "UPPER_BACK",
  "LOWER_BACK",
  "HIP",
  "THIGH",
  "KNEE",
  "LEG",
  "ANKLE_FOOT",
  "OTHER",
] as const;

export const conditionSides = ["LEFT", "RIGHT", "BOTH"] as const;

export const conditionKinds = ["SURGERY", "INJURY", "CHRONIC", "OTHER"] as const;

export type BodyZone = (typeof bodyZones)[number];
export type ConditionSide = (typeof conditionSides)[number];
export type ConditionKind = (typeof conditionKinds)[number];

export interface Condition {
  zone: BodyZone;
  /** Only zones that come in pairs have a side. */
  side?: ConditionSide;
  kind: ConditionKind;
  /** "YYYY-MM-DD", Lima day of the surgery or the start of the problem. */
  startedOn?: string;
}

interface ZoneInfo {
  /** Option in the form ("Rodilla"). */
  label: string;
  /** Singular noun as used in a sentence ("rodilla") and its gender, for the side adjective. */
  noun: string;
  plural: string;
  feminine: boolean;
  sided: boolean;
  /** Suggested zones for the physio treatments card (free text in the end). */
  treatmentZones: readonly string[];
}

export const zoneInfo: Record<BodyZone, ZoneInfo> = {
  NECK: {
    label: "Cuello",
    noun: "cuello",
    plural: "cuello",
    feminine: false,
    sided: false,
    treatmentZones: ["Cuello", "Trapecio", "Base del cráneo", "Hombros"],
  },
  SHOULDER: {
    label: "Hombro",
    noun: "hombro",
    plural: "hombros",
    feminine: false,
    sided: true,
    treatmentZones: [
      "Hombro anterior",
      "Hombro posterior",
      "Manguito rotador",
      "Trapecio",
      "Omóplato",
    ],
  },
  ELBOW: {
    label: "Codo",
    noun: "codo",
    plural: "codos",
    feminine: false,
    sided: true,
    treatmentZones: ["Codo", "Epicóndilo", "Epitróclea", "Antebrazo", "Bíceps", "Tríceps"],
  },
  WRIST_HAND: {
    label: "Muñeca y mano",
    noun: "muñeca y mano",
    plural: "muñecas y manos",
    feminine: true,
    sided: true,
    treatmentZones: ["Muñeca", "Palma", "Dedos", "Pulgar", "Antebrazo"],
  },
  UPPER_BACK: {
    label: "Espalda alta",
    noun: "espalda alta",
    plural: "espalda alta",
    feminine: true,
    sided: false,
    treatmentZones: ["Espalda alta", "Entre los omóplatos", "Trapecio", "Costillas"],
  },
  LOWER_BACK: {
    label: "Zona lumbar",
    noun: "zona lumbar",
    plural: "zona lumbar",
    feminine: true,
    sided: false,
    treatmentZones: ["Zona lumbar", "Sacro", "Glúteos", "Cuadrado lumbar"],
  },
  HIP: {
    label: "Cadera",
    noun: "cadera",
    plural: "caderas",
    feminine: true,
    sided: true,
    treatmentZones: ["Cadera", "Glúteos", "Ingle", "Cintilla iliotibial", "Piriforme"],
  },
  THIGH: {
    label: "Muslo",
    noun: "muslo",
    plural: "muslos",
    feminine: false,
    sided: true,
    treatmentZones: ["Cuádriceps", "Isquiotibiales", "Aductores", "Cintilla iliotibial"],
  },
  KNEE: {
    label: "Rodilla",
    noun: "rodilla",
    plural: "rodillas",
    feminine: true,
    sided: true,
    treatmentZones: [
      "Rodilla anterior",
      "Tendón rotuliano",
      "Rodilla medial",
      "Rodilla lateral",
      "Hueco poplíteo",
      "Cuádriceps",
      "Isquiotibiales",
      "Cintilla iliotibial",
      "Gemelos",
    ],
  },
  LEG: {
    label: "Pierna",
    noun: "pierna",
    plural: "piernas",
    feminine: true,
    sided: true,
    treatmentZones: ["Gemelos", "Sóleo", "Espinilla", "Tendón de Aquiles"],
  },
  ANKLE_FOOT: {
    label: "Tobillo y pie",
    noun: "tobillo y pie",
    plural: "tobillos y pies",
    feminine: false,
    sided: true,
    treatmentZones: ["Tobillo", "Tendón de Aquiles", "Planta del pie", "Empeine", "Dedos del pie"],
  },
  OTHER: {
    label: "Otra zona",
    noun: "zona",
    plural: "zonas",
    feminine: true,
    sided: false,
    treatmentZones: [],
  },
};

export const conditionKindLabels: Record<ConditionKind, string> = {
  SURGERY: "Operación",
  INJURY: "Lesión o golpe",
  CHRONIC: "Dolor que viene de tiempo",
  OTHER: "Otro",
};

export const conditionSideLabels: Record<ConditionSide, string> = {
  LEFT: "Izquierdo",
  RIGHT: "Derecho",
  BOTH: "Ambos",
};

export function isSidedZone(zone: BodyZone) {
  return zoneInfo[zone].sided;
}

/** "Fecha de la operación" for a surgery; "Desde cuándo" for everything else. */
export function conditionDateLabel(kind: ConditionKind) {
  return kind === "SURGERY" ? "Fecha de la operación" : "Desde cuándo";
}

const sinceLabels: Record<ConditionKind, string> = {
  SURGERY: "desde la operación",
  INJURY: "desde la lesión",
  CHRONIC: "desde que empezó",
  OTHER: "desde que empezó",
};

function sideAdjective(side: ConditionSide, feminine: boolean) {
  if (side === "LEFT") return feminine ? "izquierda" : "izquierdo";
  if (side === "RIGHT") return feminine ? "derecha" : "derecho";
  return undefined;
}

// "rodilla derecha", "hombros", "cuello". Undefined when the zone is "Otra zona".
function zoneNoun(condition: Condition) {
  if (condition.zone === "OTHER") return undefined;
  const info = zoneInfo[condition.zone];
  if (!info.sided || !condition.side) return info.noun;
  if (condition.side === "BOTH") return info.plural;
  return `${info.noun} ${sideAdjective(condition.side, info.feminine)}`;
}

/** "tu rodilla derecha" for sentences; undefined when there is no usable zone (use neutral text). */
export function conditionAreaPhrase(condition: Condition | null | undefined) {
  if (!condition) return undefined;
  const noun = zoneNoun(condition);
  if (!noun) return undefined;
  return `${condition.side === "BOTH" ? "tus" : "tu"} ${noun}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Whole weeks since the start, counting the first week as week 1. Undefined without a past date. */
export function conditionWeek(condition: Condition, today = getRecoveryDateKey()) {
  if (!condition.startedOn || condition.startedOn > today) return undefined;
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${condition.startedOn}T00:00:00Z`)) /
      86_400_000,
  );
  return Math.floor(days / 7) + 1;
}

/** "Rodilla derecha · semana 12 desde la operación". Undefined when there is no condition. */
export function conditionSummary(condition: Condition | null | undefined, today?: string) {
  if (!condition) return undefined;
  const noun = zoneNoun(condition);
  const title = noun
    ? capitalize(noun)
    : condition.kind === "OTHER"
      ? "Mi recuperación"
      : conditionKindLabels[condition.kind];
  const week = conditionWeek(condition, today);
  if (week !== undefined) return `${title} · semana ${week} ${sinceLabels[condition.kind]}`;
  return noun ? `${title} · ${conditionKindLabels[condition.kind].toLowerCase()}` : title;
}

const genericTreatmentZones = [
  "Zona lumbar",
  "Cuello",
  "Hombro",
  "Rodilla",
  "Cadera",
  "Tobillo",
  "Cuádriceps",
  "Isquiotibiales",
  "Glúteos",
  "Gemelos",
] as const;

/** Suggestions for the "Zona" field of a physio treatment, from the condition's zone. */
export function treatmentZoneSuggestionsFor(condition: Condition | null | undefined) {
  const zones = condition ? zoneInfo[condition.zone].treatmentZones : [];
  return zones.length > 0 ? zones : genericTreatmentZones;
}

const minStartedOn = "1950-01-01";

/** True for a real calendar day, not in the future (Lima) and not absurdly old. */
export function isValidStartedOn(value: string, today = getRecoveryDateKey()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return false;
  if (addRecoveryDays(value, 0) !== value) return false;
  return value >= minStartedOn && value <= today;
}
