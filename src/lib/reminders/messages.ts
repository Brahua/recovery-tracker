import type { PushPayload } from "@/lib/push/sender";
import type { ReminderKind } from "@/types/reminders";

export const reminderMessages: Record<ReminderKind, PushPayload> = {
  session: {
    title: "¿Hiciste tu sesión hoy?",
    body: "Regístrala en un minuto: dolor, carga y ejercicios.",
    url: "/registrar?mode=session",
    tag: "reminder-session",
  },
  // "closeout" is the stored kind; since the morning check-in replaced the nightly closeout it
  // reminds "¿Cómo amaneciste?".
  closeout: {
    title: "¿Cómo amaneciste?",
    body: "Sueño, dolor y rigidez al despertar, en un minuto.",
    url: "/registrar?mode=morning",
    tag: "reminder-closeout",
  },
};

export const testMessage: PushPayload = {
  title: "Notificaciones activas",
  body: "Así te llegarán los recordatorios de Recovery Tracker.",
  url: "/ajustes",
  tag: "reminder-test",
};
