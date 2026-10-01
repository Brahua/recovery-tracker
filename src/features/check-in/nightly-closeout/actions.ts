"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createRecoveryLogRepository,
  DuplicateCloseoutDateError,
  RecordNotFoundError,
} from "@/data/recovery-log-repository";
import {
  duplicateCloseoutDateMessage,
  futureCloseoutDateMessage,
  getCloseoutDateError,
  invalidCloseoutDateMessage,
} from "@/lib/closeout-date";
import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { AuthenticationRequiredError } from "@/lib/supabase/authenticated";
import { recordIdSchema } from "@/lib/validation/recovery";
import type {
  CreateNightlyCloseoutInput,
  PainScore,
  Rating1To5,
  ReboundLevel,
} from "@/types/recovery";

const expiredSessionMessage = "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";
const genericCloseoutErrorMessage =
  "No se pudo guardar el cierre. Revisa los datos e intenta otra vez.";
const missingCloseoutMessage =
  "Ese cierre ya no existe. Vuelve a Historial para ver tus registros.";
const genericDeleteErrorMessage = "No se pudo eliminar el cierre. Intenta otra vez.";

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

function readCloseoutForm(formData: FormData): CreateNightlyCloseoutInput {
  return {
    date: getSingleValue(formData, "date"),
    endOfDayPain: parsePainScore(getSingleValue(formData, "endOfDayPain")),
    energy: parseRating1To5(getSingleValue(formData, "energy")),
    sleepHours: Number(getSingleValue(formData, "sleepHours")),
    sleepQuality: parseRating1To5(getSingleValue(formData, "sleepQuality")),
    reboundPainLevel: parseReboundLevel(getSingleValue(formData, "reboundPainLevel")),
    notes: getSingleValue(formData, "notes") || undefined,
  };
}

function revalidateRecoveryViews() {
  // The (app) layout renders the streak, so refresh it along with the pages.
  revalidatePath("/", "layout");
  revalidatePath("/registrar");
  revalidatePath("/historial");
  revalidatePath("/insights");
  revalidatePath("/reporte");
}

function getSaveErrorMessage(error: unknown) {
  if (error instanceof DuplicateCloseoutDateError) {
    return duplicateCloseoutDateMessage;
  }

  if (error instanceof RecordNotFoundError) {
    return missingCloseoutMessage;
  }

  if (error instanceof Error) {
    if (
      error.message === duplicateCloseoutDateMessage ||
      error.message === futureCloseoutDateMessage ||
      error.message === invalidCloseoutDateMessage
    ) {
      return error.message;
    }

    if (error instanceof AuthenticationRequiredError) {
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

    const input = readCloseoutForm(formData);
    const savedCloseout = await repository.createNightlyCloseout(input);

    savedCloseoutId = savedCloseout.id;
    savedCloseoutDate = savedCloseout.date;
    summary = buildCloseoutSummary(input.endOfDayPain, input.energy, input.reboundPainLevel);
  } catch (error) {
    const errorMessage = getSaveErrorMessage(error);

    if (errorMessage === genericCloseoutErrorMessage) {
      console.error("Failed to save nightly closeout.", error);
    }

    return { error: errorMessage };
  }

  revalidateRecoveryViews();
  redirect(
    `/registrar?mode=closeout&date=${encodeURIComponent(savedCloseoutDate)}&nightlySaved=1&closeoutId=${encodeURIComponent(savedCloseoutId)}&nightlySummary=${encodeURIComponent(summary)}`,
  );
}

export async function updateNightlyCloseoutAction(
  _previousState: NightlyCloseoutActionState,
  formData: FormData,
): Promise<NightlyCloseoutActionState> {
  const id = getSingleValue(formData, "closeoutId");
  let historyHref = "";

  if (!recordIdSchema.safeParse(id).success) {
    return { error: missingCloseoutMessage };
  }

  try {
    const repository = await createRecoveryLogRepository();
    const date = getSingleValue(formData, "date");
    const dateError = getCloseoutDateError(date);

    if (dateError) {
      throw new Error(dateError);
    }

    const closeoutsOnDate = await repository.listNightlyCloseouts({ from: date, to: date });

    if (closeoutsOnDate.some((closeout) => closeout.id !== id)) {
      throw new DuplicateCloseoutDateError();
    }

    const saved = await repository.updateNightlyCloseout(id, readCloseoutForm(formData));
    const href = getHistoryHrefForDate(saved.date);
    const toastKey = encodeURIComponent(`${saved.id}:${saved.updatedAt}`);
    historyHref = `${href}${href.includes("?") ? "&" : "?"}updated=closeout&key=${toastKey}`;
  } catch (error) {
    const errorMessage = getSaveErrorMessage(error);

    if (errorMessage === genericCloseoutErrorMessage) {
      console.error("Failed to update nightly closeout.", error);
    }

    return { error: errorMessage };
  }

  revalidateRecoveryViews();
  redirect(historyHref);
}

export interface DeleteRecordResult {
  ok: boolean;
  error?: string;
}

export async function deleteNightlyCloseoutAction(id: string): Promise<DeleteRecordResult> {
  if (!recordIdSchema.safeParse(id).success) {
    return { ok: false, error: missingCloseoutMessage };
  }

  try {
    const repository = await createRecoveryLogRepository();
    await repository.deleteNightlyCloseout(id);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      return { ok: false, error: missingCloseoutMessage };
    }

    if (error instanceof AuthenticationRequiredError) {
      return { ok: false, error: expiredSessionMessage };
    }

    console.error("Failed to delete nightly closeout.", error);
    return { ok: false, error: genericDeleteErrorMessage };
  }

  revalidateRecoveryViews();
  return { ok: true };
}
