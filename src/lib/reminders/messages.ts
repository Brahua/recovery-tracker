import type { PushPayload } from "@/lib/push/sender";
import type { ReminderKind } from "@/types/reminders";

export const reminderMessages: Record<ReminderKind, PushPayload> = {
  session: {
    title: "¿Hiciste tu sesión hoy?",
    body: "Regístrala en un minuto: dolor, carga y ejercicios.",
    url: "/registrar?mode=session",
    tag: "reminder-session",
  },
  closeout: {
    title: "Cierra el día",
    body: "Dolor, energía y sueño antes de dormir.",
    url: "/registrar?mode=closeout",
    tag: "reminder-closeout",
  },
};

export const testMessage: PushPayload = {
  title: "Notificaciones activas",
  body: "Así te llegarán los recordatorios de Recovery Tracker.",
  url: "/ajustes",
  tag: "reminder-test",
};
