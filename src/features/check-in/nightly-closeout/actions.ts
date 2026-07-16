"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import type { PainScore, Rating1To5, ReboundLevel } from "@/types/recovery";

function getSingleValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePainScore(value: string) {
  return Number(value) as PainScore;
}

function parseRating1To5(value: string) {
  return Number(value) as Rating1To5;
}

function parseReboundLevel(value: string) {
  return value as ReboundLevel;
}

function buildCloseoutSummary(
  endOfDayPain: number,
  energy: number,
  reboundPainLevel: ReboundLevel,
) {
  if (reboundPainLevel === "STRONG") {
    return "Cierre guardado; hoy termino irritado y conviene observar como amanece.";
  }

  if (reboundPainLevel === "MODERATE") {
    return "Cierre guardado; hubo rebote moderado y ya queda registrado para comparar.";
  }

  if (endOfDayPain <= 3 && energy >= 4) {
    return "Cierre guardado; hoy termina bastante estable y con buena energia.";
  }

  if (reboundPainLevel === "NONE") {
    return "Cierre guardado; por ahora no aparece rebote despues de la sesion.";
  }

  return "Cierre guardado; hoy queda registrado con respuesta intermedia.";
}

export async function createNightlyCloseoutAction(formData: FormData) {
  const repository = await createRecoveryLogRepository();
  let summary = "";

  try {
    const endOfDayPain = parsePainScore(getSingleValue(formData, "endOfDayPain"));
    const energy = parseRating1To5(getSingleValue(formData, "energy"));
    const sleepQuality = parseRating1To5(getSingleValue(formData, "sleepQuality"));
    const reboundPainLevel = parseReboundLevel(
      getSingleValue(formData, "reboundPainLevel"),
    );

    await repository.createNightlyCloseout({
      date: getSingleValue(formData, "date"),
      endOfDayPain,
      energy,
      sleepHours: Number(getSingleValue(formData, "sleepHours")),
      sleepQuality,
      reboundPainLevel,
      notes: getSingleValue(formData, "notes") || undefined,
    });

    summary = buildCloseoutSummary(endOfDayPain, energy, reboundPainLevel);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo guardar el cierre. Revisa los datos e intenta otra vez.";

    redirect(`/registrar?mode=closeout&nightlyError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/");
  revalidatePath("/registrar");
  revalidatePath("/insights");
  revalidatePath("/reporte");
  redirect(
    `/registrar?mode=closeout&nightlySaved=1&nightlySummary=${encodeURIComponent(summary)}`,
  );
}
