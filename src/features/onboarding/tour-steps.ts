// The tour shown on /bienvenida: one card per part of the app, in the order a day goes.
export type TourIcon = "today" | "session" | "closeout" | "history" | "insights" | "install";

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
    body: "Hoy te dice qué toca: la sesión de ejercicios y el cierre de la noche. El anillo se completa con las dos y la racha suma cada día que registras.",
  },
  {
    icon: "session",
    kicker: "Registrar sesión",
    title: "Tu sesión, en un par de minutos.",
    body: "Empieza desde una rutina o agrega ejercicios del catálogo, con series, repeticiones y peso. Si fuiste al centro, marca los tratamientos que te hicieron.",
  },
  {
    icon: "closeout",
    kicker: "Cierre nocturno",
    title: "Cierra el día antes de dormir.",
    body: "Dolor, rigidez, ánimo y sueño en un minuto. Así ves cómo responde tu cuerpo a lo que hiciste.",
  },
  {
    icon: "history",
    kicker: "Historial",
    title: "Todo queda guardado.",
    body: "Cada sesión y cada cierre quedan en Historial. Si te equivocaste en algo, ábrelo y corrígelo.",
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
    body: "Agrégala a la pantalla de inicio y activa los recordatorios para no olvidar la sesión ni el cierre. Un día a la vez.",
  },
];
