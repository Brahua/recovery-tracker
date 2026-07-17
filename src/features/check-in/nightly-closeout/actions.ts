"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import {
  duplicateCloseoutDateMessage,
  futureCloseoutDateMessage,
  getCloseoutDateError,
  invalidCloseoutDateMessage,
} from "@/lib/closeout-date";
import type { PainScore, Rating1To5, ReboundLevel } from "@/types/recovery";

const expiredSessionMessage =
  "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";
const genericCloseoutErrorMessage =
  "No se pudo guardar el cierre. Revisa los datos e intenta otra vez.";

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
    return "Cierre guardado; el día terminó irritado y conviene observar cómo responde después.";
  }

  if (reboundPainLevel === "MODERATE") {
    return "Cierre guardado; hubo rebote moderado y ya queda registrado para comparar.";
  }

  if (endOfDayPain <= 3 && energy >= 4) {
    return "Cierre guardado; la rodilla terminó bastante estable y con buena energía.";
  }

  if (reboundPainLevel === "NONE") {
    return "Cierre guardado; no quedó registrado rebote después de la sesión.";
  }

  return "Cierre guardado; el día quedó registrado con respuesta intermedia.";
}

export interface NightlyCloseoutActionState {
  error: string | null;
}

function getSaveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message === duplicateCloseoutDateMessage ||
      error.message === futureCloseoutDateMessage ||
      error.message === invalidCloseoutDateMessage
    ) {
      return error.message;
    }

    if (error.message === "Authenticated user is required.") {
      return expiredSessionMessage;
    }
  }

  return genericCloseoutErrorMessage;
}

export async function createNightlyCloseoutAction(
  _previousState: NightlyCloseoutActionState,
  formData: FormData,
): Promise<NightlyCloseoutActionState> {
  const repository = await createRecoveryLogRepository();
  let summary = "";
  let savedCloseoutId = "";
  let savedCloseoutDate = "";

  try {
    const date = getSingleValue(formData, "date");
    const dateError = getCloseoutDateError(date);

    if (dateError) {
      throw new Error(dateError);
    }

    const existingCloseouts = await repository.listNightlyCloseouts({
      from: date,
      to: date,
    });

    if (existingCloseouts.length > 0) {
      throw new Error(duplicateCloseoutDateMessage);
    }

    const endOfDayPain = parsePainScore(getSingleValue(formData, "endOfDayPain"));
    const energy = parseRating1To5(getSingleValue(formData, "energy"));
    const sleepQuality = parseRating1To5(getSingleValue(formData, "sleepQuality"));
    const reboundPainLevel = parseReboundLevel(
      getSingleValue(formData, "reboundPainLevel"),
    );

    const savedCloseout = await repository.createNightlyCloseout({
      date,
      endOfDayPain,
      energy,
      sleepHours: Number(getSingleValue(formData, "sleepHours")),
      sleepQuality,
      reboundPainLevel,
      notes: getSingleValue(formData, "notes") || undefined,
    });

    savedCloseoutId = savedCloseout.id;
    savedCloseoutDate = savedCloseout.date;
    summary = buildCloseoutSummary(endOfDayPain, energy, reboundPainLevel);
  } catch (error) {
    const errorMessage = getSaveErrorMessage(error);

    if (
      errorMessage === genericCloseoutErrorMessage
    ) {
      console.error("Failed to save nightly closeout.", error);
    }

    return { error: errorMessage };
  }

  revalidatePath("/");
  revalidatePath("/registrar");
  revalidatePath("/historial");
  revalidatePath("/insights");
  revalidatePath("/reporte");
  redirect(
    `/registrar?mode=closeout&date=${encodeURIComponent(savedCloseoutDate)}&nightlySaved=1&closeoutId=${encodeURIComponent(savedCloseoutId)}&nightlySummary=${encodeURIComponent(summary)}`,
  );
}
