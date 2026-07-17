"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import {
  invalidExercisePayloadMessage,
  parseExercisePayload,
} from "@/features/check-in/post-therapy/exercise-payload";
import type {
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

function parseOccurredAt(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
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

function getSaveErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === invalidExercisePayloadMessage) {
      return error.message;
    }

    if (error.message === "Authenticated user is required.") {
      return "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";
    }
  }

  return "No se pudo guardar la sesión. Revisa los datos e intenta otra vez.";
}

export async function createPostTherapySessionAction(
  _previousState: PostTherapyActionState,
  formData: FormData,
): Promise<PostTherapyActionState> {
  const repository = await createRecoveryLogRepository();
  let summary = "";
  let savedSessionId = "";

  try {
    const sessionType = getSingleValue(formData, "sessionType") as SessionType;
    const painBefore = parsePainScore(getSingleValue(formData, "painBefore"));
    const painDuringValue = getSingleValue(formData, "painDuring");
    const painAfter = parsePainScore(getSingleValue(formData, "painAfter"));
    const perceivedLoad = parseRating1To5(
      getSingleValue(formData, "perceivedLoad"),
    );
    const finalState = getSingleValue(formData, "finalState") as FinalState;

    const savedSession = await repository.createRehabSession({
      occurredAt: parseOccurredAt(getSingleValue(formData, "occurredAt")),
      sessionType,
      painBefore,
      painDuring: parseOptionalPainScore(painDuringValue),
      painAfter,
      perceivedLoad,
      exercises: parseExercisePayload(getSingleValue(formData, "exercisesPayload")),
      finalState,
      notes: getSingleValue(formData, "notes") || undefined,
    });

    savedSessionId = savedSession.id;
    summary = buildMicroSummary(painBefore, painAfter, finalState);
  } catch (error) {
    const errorMessage = getSaveErrorMessage(error);

    if (
      errorMessage !== invalidExercisePayloadMessage &&
      errorMessage !== "Tu sesión expiró. Recarga la página e inicia sesión nuevamente."
    ) {
      console.error("Failed to save rehab session.", error);
    }

    return { error: errorMessage };
  }

  revalidatePath("/");
  revalidatePath("/registrar");
  revalidatePath("/historial");
  revalidatePath("/insights");
  revalidatePath("/reporte");
  redirect(
    `/registrar?mode=session&sessionSaved=1&sessionId=${encodeURIComponent(savedSessionId)}&sessionSummary=${encodeURIComponent(summary)}`,
  );
}
