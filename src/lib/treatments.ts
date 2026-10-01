import type {
  SessionTreatment,
  TreatmentCategory,
  TreatmentModality,
} from "@/types/recovery";

export const maxTreatmentsPerSession = 15;
export const maxTreatmentMinutes = 120;
export const maxTreatmentTextLength = 60;
export const maxTherapistNotesLength = 1000;

type CatalogModality = Exclude<TreatmentModality, "OTHER">;

interface TreatmentOption {
  modality: CatalogModality;
  label: string;
  takesMinutes: boolean;
}

export interface TreatmentCategoryGroup {
  category: TreatmentCategory;
  label: string;
  options: TreatmentOption[];
}

export const treatmentCatalog: TreatmentCategoryGroup[] = [
  {
    category: "PHYSICAL_AGENT",
    label: "Agentes físicos",
    options: [
      { modality: "TECAR", label: "Tecarterapia", takesMinutes: true },
      { modality: "SHOCKWAVE", label: "Ondas de choque", takesMinutes: true },
      { modality: "LASER", label: "Láser", takesMinutes: true },
      { modality: "ULTRASOUND", label: "Ultrasonido", takesMinutes: true },
      { modality: "ELECTROTHERAPY", label: "Electroterapia (TENS/EMS)", takesMinutes: true },
      { modality: "MAGNETOTHERAPY", label: "Magnetoterapia", takesMinutes: true },
      { modality: "CRYOTHERAPY", label: "Crioterapia / hielo", takesMinutes: true },
      { modality: "THERMOTHERAPY", label: "Calor", takesMinutes: true },
      { modality: "PRESSOTHERAPY", label: "Presoterapia", takesMinutes: true },
    ],
  },
  {
    category: "MANUAL_THERAPY",
    label: "Terapia manual",
    options: [
      { modality: "MASSAGE", label: "Masaje", takesMinutes: true },
      { modality: "JOINT_MOBILIZATION", label: "Movilización articular", takesMinutes: true },
      { modality: "MYOFASCIAL_RELEASE", label: "Liberación miofascial", takesMinutes: true },
      { modality: "LYMPHATIC_DRAINAGE", label: "Drenaje linfático", takesMinutes: true },
    ],
  },
  {
    category: "INVASIVE",
    label: "Punción e invasivas",
    options: [
      { modality: "DRY_NEEDLING", label: "Punción seca", takesMinutes: true },
      { modality: "EPI", label: "EPI (electrólisis percutánea)", takesMinutes: true },
      { modality: "MESOTHERAPY", label: "Mesoterapia", takesMinutes: false },
      { modality: "INFILTRATION", label: "Infiltración", takesMinutes: false },
    ],
  },
  {
    category: "TAPING",
    label: "Vendaje",
    options: [
      { modality: "KINESIO_TAPE", label: "Kinesiotape", takesMinutes: false },
      { modality: "FUNCTIONAL_TAPE", label: "Vendaje funcional", takesMinutes: false },
    ],
  },
];

export const treatmentZoneSuggestions = [
  "Rodilla anterior",
  "Tendón rotuliano",
  "Rodilla medial",
  "Rodilla lateral",
  "Hueco poplíteo",
  "Cuádriceps",
  "Isquiotibiales",
  "Cintilla iliotibial",
  "Gemelos",
] as const;

const optionByModality = new Map<CatalogModality, TreatmentOption & { category: TreatmentCategory }>(
  treatmentCatalog.flatMap((group) =>
    group.options.map((option) => [option.modality, { ...option, category: group.category }] as const),
  ),
);

/** Category each catalog code belongs to; "OTHER" is valid in every category. */
export function isModalityInCategory(modality: TreatmentModality, category: TreatmentCategory) {
  return modality === "OTHER" || optionByModality.get(modality)?.category === category;
}

export function treatmentTakesMinutes(modality: TreatmentModality) {
  return modality === "OTHER" || (optionByModality.get(modality)?.takesMinutes ?? false);
}

export function treatmentLabel(treatment: Pick<SessionTreatment, "modality" | "customName">) {
  if (treatment.modality === "OTHER") {
    return treatment.customName ?? "Otro";
  }

  return optionByModality.get(treatment.modality)?.label ?? treatment.modality;
}

export function formatTreatment(treatment: SessionTreatment) {
  return [
    treatmentLabel(treatment),
    treatment.bodyZone,
    treatment.durationMinutes ? `${treatment.durationMinutes} min` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatTreatmentCount(count: number) {
  return `${count} tratamiento${count === 1 ? "" : "s"}`;
}

export interface TreatmentDraft {
  id: string;
  category: TreatmentCategory;
  modality: TreatmentModality;
  customName: string;
  bodyZone: string;
  durationMinutes: string;
}

export function createTreatmentDraft(
  id: string,
  category: TreatmentCategory,
  modality: TreatmentModality,
): TreatmentDraft {
  return { id, category, modality, customName: "", bodyZone: "", durationMinutes: "" };
}

function parseMinutes(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const minutes = Number(trimmed);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= maxTreatmentMinutes
    ? minutes
    : null;
}

function draftKey(draft: TreatmentDraft) {
  return `${draft.modality}:${draft.modality === "OTHER" ? draft.customName.trim().toLocaleLowerCase("es") : ""}`;
}

/** Ids of drafts that repeat an earlier one (same code, or same "Otro" name). */
export function findRepeatedTreatmentIds(drafts: TreatmentDraft[]) {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const draft of drafts) {
    if (draft.modality === "OTHER" && !draft.customName.trim()) continue;

    const key = draftKey(draft);
    if (seen.has(key)) repeated.add(draft.id);
    seen.add(key);
  }

  return repeated;
}

export function getTreatmentDraftError(draft: TreatmentDraft): string | null {
  if (draft.modality === "OTHER") {
    const name = draft.customName.trim();
    if (!name) return "Escribe qué tratamiento fue.";
    if (name.length > maxTreatmentTextLength) return `Máximo ${maxTreatmentTextLength} caracteres.`;
  }

  if (draft.bodyZone.trim().length > maxTreatmentTextLength) {
    return `La zona admite máximo ${maxTreatmentTextLength} caracteres.`;
  }

  if (treatmentTakesMinutes(draft.modality) && parseMinutes(draft.durationMinutes) === null) {
    return `Los minutos van de 1 a ${maxTreatmentMinutes}.`;
  }

  return null;
}

export function countValidTreatments(drafts: TreatmentDraft[]) {
  const repeated = findRepeatedTreatmentIds(drafts);
  return drafts.filter((draft) => !repeated.has(draft.id) && getTreatmentDraftError(draft) === null)
    .length;
}

export function toTreatmentPayload(drafts: TreatmentDraft[]): SessionTreatment[] {
  return drafts.map((draft) => {
    const minutes = treatmentTakesMinutes(draft.modality) ? parseMinutes(draft.durationMinutes) : undefined;

    return {
      category: draft.category,
      modality: draft.modality,
      customName: draft.modality === "OTHER" ? draft.customName.trim() || undefined : undefined,
      bodyZone: draft.bodyZone.trim() || undefined,
      durationMinutes: minutes ?? undefined,
    };
  });
}
