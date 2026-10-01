"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRecoveryLogRepository, RecordNotFoundError } from "@/data/recovery-log-repository";
import {
  invalidExercisePayloadMessage,
  parseExercisePayload,
} from "@/features/check-in/post-therapy/exercise-payload";
import {
  invalidTreatmentPayloadMessage,
  parseTreatmentPayload,
} from "@/features/check-in/post-therapy/treatment-payload";
import { getHistoryHrefForDate } from "@/lib/history-view-model";
import { getRecoveryDateKey, parseRecoveryDateTimeLocal } from "@/lib/recovery-date";
import { AuthenticationRequiredError } from "@/lib/supabase/authenticated";
import { recordIdSchema } from "@/lib/validation/recovery";
import type {
  CreateRehabSessionInput,
  FinalState,
  PainScore,
  Rating1To5,
  SessionType,
} from "@/types/recovery";

function getSingleValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePainScore(value: string) {
  return Number(value) as PainScore;
}

function parseOptionalPainScore(value: string) {
  return value ? (Number(value) as PainScore) : undefined;
}

function parseRating1To5(value: string) {
  return Number(value) as Rating1To5;
}

const invalidOccurredAtMessage = "Selecciona una fecha y hora válidas para la sesión.";
const futureOccurredAtMessage = "No puedes registrar una sesión con fecha futura.";

// The form sends Lima wall-clock time; the server runs in UTC.
function parseOccurredAt(value: string) {
  const occurredAt = parseRecoveryDateTimeLocal(value);

  if (!occurredAt) {
    throw new Error(invalidOccurredAtMessage);
  }

  if (getRecoveryDateKey(occurredAt) > getRecoveryDateKey()) {
    throw new Error(futureOccurredAtMessage);
  }

  return occurredAt;
}

function buildMicroSummary(painBefore: number, painAfter: number, finalState: FinalState) {
  const delta = painAfter - painBefore;

  if (delta < 0) {
    return `Dolor termino ${Math.abs(delta)} punto${Math.abs(delta) === 1 ? "" : "s"} mas bajo que al inicio.`;
  }

  if (delta > 0) {
    return `Dolor termino ${delta} punto${delta === 1 ? "" : "s"} mas alto; observa como responde esta noche.`;
  }

  if (finalState === "BETTER") {
    return "La sesion quedo registrada; hoy se siente mas llevadera sin cambiar el dolor.";
  }

  if (finalState === "WORSE") {
    return "La sesion quedo registrada; observa si aparece rebote mas tarde.";
  }

  return "La sesion quedo registrada con respuesta estable.";
}

export interface PostTherapyActionState {
  error: string | null;
}

const emptySessionMessage = "Agrega al menos un ejercicio (o un tratamiento, si es fisio guiada).";
const missingSessionMessage = "Esa sesión ya no existe. Vuelve a Historial para ver tus registros.";
const expiredSessionMessage = "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";
const expectedErrorMessages = new Set([
  invalidExercisePayloadMessage,
  invalidTreatmentPayloadMessage,
  emptySessionMessage,
  invalidOccurredAtMessage,
  futureOccurredAtMessage,
  missingSessionMessage,
]);

function getSaveErrorMessage(error: unknown) {
  if (error instanceof RecordNotFoundError) {
    return missingSessionMessage;
  }

  if (error instanceof Error) {
    if (expectedErrorMessages.has(error.message)) {
      return error.message;
    }

    if (error instanceof AuthenticationRequiredError) {
      return expiredSessionMessage;
    }
  }

  return "No se pudo guardar la sesión. Revisa los datos e intenta otra vez.";
}

function logUnexpectedError(errorMessage: string, error: unknown, context: string) {
  if (!expectedErrorMessages.has(errorMessage) && errorMessage !== expiredSessionMessage) {
    console.error(context, error);
  }
}

// Untrusted form data to a session input; the repository validates it with zod.
function readSessionForm(formData: FormData): CreateRehabSessionInput {
  const sessionType = getSingleValue(formData, "sessionType") as SessionType;
  const isPhysiotherapy = sessionType === "PHYSIOTHERAPY";
  const exercises = parseExercisePayload(getSingleValue(formData, "exercisesPayload"));
  const treatments = isPhysiotherapy
    ? parseTreatmentPayload(getSingleValue(formData, "treatmentsPayload"))
    : [];

  if (exercises.length === 0 && treatments.length === 0) {
    throw new Error(emptySessionMessage);
  }

  return {
    occurredAt: parseOccurredAt(getSingleValue(formData, "occurredAt")),
    sessionType,
    painBefore: parsePainScore(getSingleValue(formData, "painBefore")),
    painDuring: parseOptionalPainScore(getSingleValue(formData, "painDuring")),
    painAfter: parsePainScore(getSingleValue(formData, "painAfter")),
    perceivedLoad: parseRating1To5(getSingleValue(formData, "perceivedLoad")),
    exercises,
    finalState: getSingleValue(formData, "finalState") as FinalState,
    notes: getSingleValue(formData, "notes") || undefined,
    treatments,
    therapistNotes: isPhysiotherapy
      ? getSingleValue(formData, "therapistNotes") || undefined
      : undefined,
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

export async function createPostTherapySessionAction(
  _previousState: PostTherapyActionState,
  formData: FormData,
): Promise<PostTherapyActionState> {
  const repository = await createRecoveryLogRepository();
  let summary = "";
  let savedSessionId = "";

  try {
    const input = readSessionForm(formData);
    const savedSession = await repository.createRehabSession(input);

    savedSessionId = savedSession.id;
    summary = buildMicroSummary(input.painBefore, input.painAfter, input.finalState);
  } catch (error) {
    const errorMessage = getSaveErrorMessage(error);
    logUnexpectedError(errorMessage, error, "Failed to save rehab session.");
    return { error: errorMessage };
  }

  revalidateRecoveryViews();
  redirect(
    `/registrar?mode=session&sessionSaved=1&sessionId=${encodeURIComponent(savedSessionId)}&sessionSummary=${encodeURIComponent(summary)}`,
  );
}

export async function updateRehabSessionAction(
  _previousState: PostTherapyActionState,
  formData: FormData,
): Promise<PostTherapyActionState> {
  const id = getSingleValue(formData, "sessionId");
  let historyHref = "";

  if (!recordIdSchema.safeParse(id).success) {
    return { error: missingSessionMessage };
  }

  try {
    const repository = await createRecoveryLogRepository();
    const saved = await repository.updateRehabSession(id, readSessionForm(formData));
    const href = getHistoryHrefForDate(getRecoveryDateKey(saved.occurredAt));
    const toastKey = encodeURIComponent(`${saved.id}:${saved.updatedAt}`);
    historyHref = `${href}${href.includes("?") ? "&" : "?"}updated=session&key=${toastKey}&session=${saved.id}`;
  } catch (error) {
    const errorMessage = getSaveErrorMessage(error);
    logUnexpectedError(errorMessage, error, "Failed to update rehab session.");
    return { error: errorMessage };
  }

  revalidateRecoveryViews();
  redirect(historyHref);
}

export interface DeleteSessionResult {
  ok: boolean;
  error?: string;
}

export async function deleteRehabSessionAction(id: string): Promise<DeleteSessionResult> {
  if (!recordIdSchema.safeParse(id).success) {
    return { ok: false, error: missingSessionMessage };
  }

  try {
    const repository = await createRecoveryLogRepository();
    await repository.deleteRehabSession(id);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      return { ok: false, error: missingSessionMessage };
    }

    if (error instanceof AuthenticationRequiredError) {
      return { ok: false, error: expiredSessionMessage };
    }

    console.error("Failed to delete rehab session.", error);
    return { ok: false, error: "No se pudo eliminar la sesión. Intenta otra vez." };
  }

  revalidateRecoveryViews();
  return { ok: true };
}
