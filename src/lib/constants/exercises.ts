import type { ExerciseShortcutId } from "@/types/recovery";

export interface ExerciseShortcutDefinition {
  id: ExerciseShortcutId;
  label: string;
}

export const exerciseShortcuts: ExerciseShortcutDefinition[] = [
  { id: "BICICLETA", label: "Bicicleta 5-10 min" },
  { id: "SENTADILLA_ESPANOLA", label: "Sentadilla espanola" },
  { id: "TKE", label: "TKE" },
  { id: "STEP_UP", label: "Step-up" },
  { id: "STEP_DOWN", label: "Step-down" },
  { id: "HIP_THRUST", label: "Hip thrust" },
  { id: "PESO_MUERTO_RUMANO", label: "Peso muerto rumano" },
  { id: "CAMINATA_LATERAL_BANDA", label: "Caminata lateral con banda" },
  { id: "PROPIOCEPCION", label: "Propiocepcion" },
  { id: "ESTIRAMIENTOS_SUAVES", label: "Estiramientos suaves" },
];

export const exerciseShortcutLabelById = Object.fromEntries(
  exerciseShortcuts.map((shortcut) => [shortcut.id, shortcut.label]),
) as Record<ExerciseShortcutId, string>;
