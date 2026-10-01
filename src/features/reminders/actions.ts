"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createRemindersRepository } from "@/data/reminders-repository";
import { getPushSender } from "@/lib/push/server";
import { testMessage } from "@/lib/reminders/messages";
import { pushSubscriptionInputSchema, reminderSettingsInputSchema } from "@/lib/reminders/settings";
import { AuthenticationRequiredError } from "@/lib/supabase/authenticated";

export interface ReminderActionResult {
  ok: boolean;
  error?: string;
}

const genericError = "No se pudo guardar. Intenta otra vez.";
const sessionExpired = "Tu sesión expiró. Recarga la página e inicia sesión nuevamente.";

function toErrorResult(error: unknown, context: string): ReminderActionResult {
  if (error instanceof AuthenticationRequiredError) return { ok: false, error: sessionExpired };
  console.error(context, error);
  return { ok: false, error: genericError };
}

export async function saveReminderSettingsAction(input: unknown): Promise<ReminderActionResult> {
  const parsed = reminderSettingsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? genericError };

  try {
    const repository = await createRemindersRepository();
    await repository.saveSettings(parsed.data);
  } catch (error) {
    return toErrorResult(error, "Failed to save reminder settings.");
  }

  revalidatePath("/ajustes");
  return { ok: true };
}

/** Stores this browser's push subscription (PushSubscription.toJSON()) for the signed-in user. */
export async function registerPushSubscriptionAction(input: unknown): Promise<ReminderActionResult> {
  const parsed = pushSubscriptionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Este navegador devolvió una suscripción inválida." };

  try {
    const userAgent = (await headers()).get("user-agent");
    const repository = await createRemindersRepository();
    await repository.registerSubscription(parsed.data, userAgent);
  } catch (error) {
    return toErrorResult(error, "Failed to register push subscription.");
  }

  revalidatePath("/ajustes");
  return { ok: true };
}

export async function unregisterPushSubscriptionAction(endpoint: unknown): Promise<ReminderActionResult> {
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) return { ok: false, error: genericError };

  try {
    const repository = await createRemindersRepository();
    await repository.removeSubscription(endpoint);
  } catch (error) {
    return toErrorResult(error, "Failed to remove push subscription.");
  }

  revalidatePath("/ajustes");
  return { ok: true };
}

/** Sends a test notification to every device of the signed-in user. */
export async function sendTestNotificationAction(): Promise<ReminderActionResult & { sent?: number }> {
  const sendPush = getPushSender();
  if (!sendPush) {
    return { ok: false, error: "Las notificaciones todavía no están configuradas en el servidor." };
  }

  try {
    const repository = await createRemindersRepository();
    const subscriptions = await repository.listSubscriptions();
    if (subscriptions.length === 0) {
      return { ok: false, error: "Activa las notificaciones en este dispositivo primero." };
    }

    let sent = 0;
    for (const subscription of subscriptions) {
      const result = await sendPush(subscription, testMessage);
      if (result.status === "sent") sent += 1;
      if (result.status === "gone") await repository.removeSubscriptionById(subscription.id);
      if (result.status === "failed") console.error("Test push failed.", result.statusCode, result.message);
    }

    if (sent === 0) {
      revalidatePath("/ajustes");
      return { ok: false, error: "No se pudo enviar. Vuelve a activar las notificaciones en este dispositivo." };
    }
    return { ok: true, sent };
  } catch (error) {
    return toErrorResult(error, "Failed to send test notification.");
  }
}
