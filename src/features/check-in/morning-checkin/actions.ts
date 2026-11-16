"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createRecoveryLogRepository,
  DuplicateMorningCheckinDateError,
  RecordNotFoundError,
} from "@/data/recovery-log-repository";
import { getHistoryHrefForDate } from "@/lib/history-view-model";
import {
  duplicateMorningDateMessage,
  futureMorningDateMessage,
  getMorningCheckinDateError,
  invalidMorningDateMessage,
} from "@/lib/morning-checkin-date";
import { addRecoveryDays, getRecoveryDateKey } from "@/lib/recovery-date";
import { AuthenticationRequiredError } from "@/lib/supabase/authenticated";
import { recordIdSchema } from "@/lib/validation/recovery";
import type {
  CreateMorningCheckinInput,
  PainScore,
  Rating1To5,
  ReboundLevel,
  StiffnessLevel,
} from "@/types/recovery";

const expiredSessionMessage = "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";
const genericSaveErrorMessage =
  "No se pudo guardar el registro de la mañana. Revisa los datos e intenta otra vez.";
const missingCheckinMessage =
  "Ese registro ya no existe. Vuelve a Historial para ver tus registros.";
const genericDeleteErrorMessage = "No se pudo eliminar el registro de la mañana. Intenta otra vez.";

export interface MorningCheckinActionState {
  error: string | null;
}

export interface DeleteRecordResult {
  ok: boolean;
  error?: string;
}

function getSingleValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readMorningCheckinForm(formData: FormData): CreateMorningCheckinInput {
  const rebound = getSingleValue(formData, "reboundPainLevel");
  return {
    date: getSingleValue(formData, "date"),
    sleepHours: Number(getSingleValue(formData, "sleepHours")),
    sleepQuality: Number(getSingleValue(formData, "sleepQuality")) as Rating1To5,
    wakingPain: Number(getSingleValue(formData, "wakingPain")) as PainScore,
    stiffnessLevel: getSingleValue(formData, "stiffnessLevel") as StiffnessLevel,
    reboundPainLevel: rebound ? (rebound as ReboundLevel) : undefined,
    notes: getSingleValue(formData, "notes") || undefined,
  };
}

/**
 * The rebound answers to the sessions of the day before; without them it is never stored, even if
 * a stale form sends it.
 */
async function withReboundOnlyAfterSessions(input: CreateMorningCheckinInput) {
  if (!input.reboundPainLevel) return input;
  const repository = await createRecoveryLogRepository();
  const dayBefore = addRecoveryDays(input.date, -1);
  const sessions = await repository.listRehabSessions({ from: dayBefore, to: dayBefore });
  const hadSessions = sessions.some(
    (session) => getRecoveryDateKey(session.occurredAt) === dayBefore,
  );
  return hadSessions ? input : { ...input, reboundPainLevel: undefined };
}

function buildMorningSummary(input: CreateMorningCheckinInput) {
  if (input.reboundPainLevel === "STRONG" || input.reboundPainLevel === "MODERATE") {
    return "Listo. Amaneciste con rebote: queda registrado para comparar con lo de ayer.";
  }
  if (input.sleepHours < 6 || input.sleepQuality <= 2) {
    return "Listo. Dormiste poco o mal: tómalo en cuenta para la carga de hoy.";
  }
  if (
    input.wakingPain <= 3 &&
    (input.stiffnessLevel === "NONE" || input.stiffnessLevel === "MILD")
  ) {
    return "Listo. Amaneciste bastante bien.";
  }
  return "Listo. Tu mañana quedó registrada.";
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
  if (error instanceof DuplicateMorningCheckinDateError) return duplicateMorningDateMessage;
  if (error instanceof RecordNotFoundError) return missingCheckinMessage;
  if (error instanceof AuthenticationRequiredError) return expiredSessionMessage;
  if (
    error instanceof Error &&
    [duplicateMorningDateMessage, futureMorningDateMessage, invalidMorningDateMessage].includes(
      error.message,
    )
  ) {
    return error.message;
  }
  return genericSaveErrorMessage;
}

export async function createMorningCheckinAction(
  _previousState: MorningCheckinActionState,
  formData: FormData,
): Promise<MorningCheckinActionState> {
  let savedId = "";
  let savedDate = "";
  let summary = "";

  try {
    const repository = await createRecoveryLogRepository();
    const input = await withReboundOnlyAfterSessions(readMorningCheckinForm(formData));
    const dateError = getMorningCheckinDateError(input.date);
    if (dateError) throw new Error(dateError);

    const existing = await repository.listMorningCheckins({ from: input.date, to: input.date });
    if (existing.length > 0) throw new Error(duplicateMorningDateMessage);

    const saved = await repository.createMorningCheckin(input);
    savedId = saved.id;
    savedDate = saved.date;
    summary = buildMorningSummary(input);
  } catch (error) {
    const message = getSaveErrorMessage(error);
    if (message === genericSaveErrorMessage)
      console.error("Failed to save morning check-in.", error);
    return { error: message };
  }

  revalidateRecoveryViews();
  redirect(
    `/registrar?mode=morning&date=${encodeURIComponent(savedDate)}&morningSaved=1&checkinId=${encodeURIComponent(savedId)}&morningSummary=${encodeURIComponent(summary)}`,
  );
}

export async function updateMorningCheckinAction(
  _previousState: MorningCheckinActionState,
  formData: FormData,
): Promise<MorningCheckinActionState> {
  const id = getSingleValue(formData, "checkinId");
  let historyHref = "";

  if (!recordIdSchema.safeParse(id).success) {
    return { error: missingCheckinMessage };
  }

  try {
    const repository = await createRecoveryLogRepository();
    const input = await withReboundOnlyAfterSessions(readMorningCheckinForm(formData));
    const dateError = getMorningCheckinDateError(input.date);
    if (dateError) throw new Error(dateError);

    const onDate = await repository.listMorningCheckins({ from: input.date, to: input.date });
    if (onDate.some((checkin) => checkin.id !== id)) throw new DuplicateMorningCheckinDateError();

    const saved = await repository.updateMorningCheckin(id, input);
    const href = getHistoryHrefForDate(saved.date);
    const toastKey = encodeURIComponent(`${saved.id}:${saved.updatedAt}`);
    historyHref = `${href}${href.includes("?") ? "&" : "?"}updated=morning&key=${toastKey}`;
  } catch (error) {
    const message = getSaveErrorMessage(error);
    if (message === genericSaveErrorMessage) {
      console.error("Failed to update morning check-in.", error);
    }
    return { error: message };
  }

  revalidateRecoveryViews();
  redirect(historyHref);
}

export async function deleteMorningCheckinAction(id: string): Promise<DeleteRecordResult> {
  if (!recordIdSchema.safeParse(id).success) {
    return { ok: false, error: missingCheckinMessage };
  }

  try {
    const repository = await createRecoveryLogRepository();
    await repository.deleteMorningCheckin(id);
  } catch (error) {
    if (error instanceof RecordNotFoundError) return { ok: false, error: missingCheckinMessage };
    if (error instanceof AuthenticationRequiredError) {
      return { ok: false, error: expiredSessionMessage };
    }
    console.error("Failed to delete morning check-in.", error);
    return { ok: false, error: genericDeleteErrorMessage };
  }

  revalidateRecoveryViews();
  return { ok: true };
}
