// The tour shown on /bienvenida: one card per part of the app, in the order a day goes.
export type TourIcon = "today" | "session" | "morning" | "history" | "insights" | "install";

export interface TourStep {
  icon: TourIcon;
  kicker: string;
  title: string;
  body: string;
}

export const tourSteps: TourStep[] = [
  {
    icon: "today",
    kicker: "Hoy",
    title: "Tu día en un vistazo.",
    body: "Hoy te dice qué toca según tu meta: cuántas sesiones al día y cuántos días a la semana. El anillo se llena con las sesiones del día y la racha suma cada día que registras algo.",
  },
  {
    icon: "session",
    kicker: "Registrar sesión",
    title: "Tu sesión, en un par de minutos.",
    body: "Empieza desde una rutina o agrega ejercicios del catálogo, con series, repeticiones y peso. Si fuiste al centro, marca los tratamientos que te hicieron.",
  },
  {
    icon: "morning",
    kicker: "Cómo amaneciste",
    title: "Un minuto al despertar.",
    body: "Cómo dormiste, cómo amaneció tu cuerpo y si se resintió por la sesión de ayer. Es opcional, pero así ves cómo responde a lo que hiciste.",
  },
  {
    icon: "history",
    kicker: "Historial",
    title: "Todo queda guardado.",
    body: "Cada sesión y cada mañana quedan en Historial. Si te equivocaste en algo, ábrelo y corrígelo.",
  },
  {
    icon: "insights",
    kicker: "Insights y Reporte",
    title: "Mira cómo vas y llévalo a consulta.",
    body: "Insights te muestra la tendencia del dolor y de la carga. Reporte arma un resumen listo para tu fisio.",
  },
  {
    icon: "install",
    kicker: "Ajustes",
    title: "Tenla siempre a mano.",
    body: "Agrégala a la pantalla de inicio, ajusta tu meta de sesiones y activa los recordatorios. Un día a la vez.",
  },
];
