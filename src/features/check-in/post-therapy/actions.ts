"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createRecoveryLogRepository } from "@/data/recovery-log-repository";
import { exerciseShortcutLabelById } from "@/lib/constants/exercises";
import type {
  ExerciseShortcutId,
  FinalState,
  PainScore,
  Rating1To5,
  SessionType,
} from "@/types/recovery";

function getSingleValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function buildExercises(formData: FormData) {
  const selectedShortcuts = formData
    .getAll("exerciseShortcuts")
    .filter((value): value is ExerciseShortcutId => typeof value === "string")
    .map((shortcutId) => ({
      name: exerciseShortcutLabelById[shortcutId],
      shortcutId,
    }));

  const customExerciseName = getSingleValue(formData, "customExerciseName");
  const customExerciseSets = parseOptionalNumber(
    getSingleValue(formData, "customExerciseSets"),
  );
  const customExerciseReps = parseOptionalNumber(
    getSingleValue(formData, "customExerciseReps"),
  );
  const customExerciseWeight = parseOptionalNumber(
    getSingleValue(formData, "customExerciseWeight"),
  );

  const customExercise = customExerciseName
    ? [
        {
          name: customExerciseName,
          sets: customExerciseSets,
          reps: customExerciseReps,
          weight: customExerciseWeight,
        },
      ]
    : [];

  return [...selectedShortcuts, ...customExercise];
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

export async function createPostTherapySessionAction(formData: FormData) {
  const repository = await createRecoveryLogRepository();
  let summary = "";

  try {
    const sessionType = getSingleValue(formData, "sessionType") as SessionType;
    const painBefore = parsePainScore(getSingleValue(formData, "painBefore"));
    const painDuringValue = getSingleValue(formData, "painDuring");
    const painAfter = parsePainScore(getSingleValue(formData, "painAfter"));
    const perceivedLoad = parseRating1To5(
      getSingleValue(formData, "perceivedLoad"),
    );
    const finalState = getSingleValue(formData, "finalState") as FinalState;

    await repository.createRehabSession({
      occurredAt: parseOccurredAt(getSingleValue(formData, "occurredAt")),
      sessionType,
      painBefore,
      painDuring: parseOptionalPainScore(painDuringValue),
      painAfter,
      perceivedLoad,
      exercises: buildExercises(formData),
      finalState,
      notes: getSingleValue(formData, "notes") || undefined,
    });

    summary = buildMicroSummary(painBefore, painAfter, finalState);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo guardar la sesion. Revisa los datos e intenta otra vez.";

    redirect(`/registrar?mode=session&sessionError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/");
  revalidatePath("/registrar");
  revalidatePath("/insights");
  revalidatePath("/reporte");
  redirect(
    `/registrar?mode=session&sessionSaved=1&sessionSummary=${encodeURIComponent(summary)}`,
  );
}
