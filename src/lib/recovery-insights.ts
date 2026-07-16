import type {
  DateRangeWindow,
  PainTrendSummary,
  ReboundSummary,
  SleepPainSummary,
  WeeklyLoadSummary,
} from "@/lib/recovery-calculations";
import {
  calculatePainTrend,
  calculateRecentExerciseFrequency,
  filterCloseoutsByRange,
  filterSessionsByRange,
  getDateRangeForLastDays,
} from "@/lib/recovery-calculations";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";
import { getRecoveryDateKey } from "@/lib/recovery-date";

export interface RecoveryInsightsInput {
  painTrend: PainTrendSummary;
  weeklyLoad: WeeklyLoadSummary;
  rebound: ReboundSummary;
  sleepPain: SleepPainSummary;
}

export interface HighPainDay {
  date: string;
  pain: number;
}

export interface MedicalReportSummary {
  windowDays: number;
  dateRange: DateRangeWindow;
  painTrend: PainTrendSummary;
  averagePain?: number;
  highPainDays: HighPainDay[];
  sessionResponseText: string;
  reboundAssociationText: string;
  sleepEnergyText: string;
  noteHighlights: string[];
  appointmentQuestions: string[];
}

function formatSignedValue(value: number | undefined) {
  if (typeof value !== "number") {
    return undefined;
  }

  return value > 0 ? `+${value}` : `${value}`;
}

export function buildPainTrendInsight(summary: PainTrendSummary) {
  if (summary.sampleCount === 0) {
    return "Todavia no hay cierres suficientes para leer una tendencia de dolor.";
  }

  if (summary.direction === "DOWN") {
    return `El dolor promedio de cierre va bajando en la ventana de ${summary.windowDays} dias (${formatSignedValue(summary.delta)}).`;
  }

  if (summary.direction === "UP") {
    return `El dolor promedio de cierre va subiendo en la ventana de ${summary.windowDays} dias (${formatSignedValue(summary.delta)}).`;
  }

  return `El dolor de cierre se mantiene bastante estable en los ultimos ${summary.windowDays} dias.`;
}

export function buildWeeklyLoadInsight(summary: WeeklyLoadSummary) {
  if (summary.sessionCount === 0) {
    return "Todavia no hay sesiones recientes para resumir la carga semanal.";
  }

  return `Se registraron ${summary.sessionCount} sesion${summary.sessionCount === 1 ? "" : "es"} con una carga total de ${summary.totalLoad} puntos en ${summary.windowDays} dias.`;
}

export function buildReboundInsight(summary: ReboundSummary) {
  if (summary.sessionCount === 0) {
    return "Sin sesiones recientes, todavia no se puede observar rebote post-sesion.";
  }

  if (summary.reboundCount === 0) {
    return `No aparece rebote en los cierres asociados a las ultimas ${summary.sessionCount} sesiones.`;
  }

  return `El rebote aparecio en ${summary.reboundCount} de las ultimas ${summary.sessionCount} sesiones registradas.`;
}

export function buildSleepPainInsight(summary: SleepPainSummary) {
  if (summary.relationship === "INSUFFICIENT_DATA") {
    return "Aun no hay suficientes noches para comparar sueno contra dolor final del dia.";
  }

  if (summary.relationship === "HIGHER_AFTER_LOW_SLEEP") {
    return `En las noches de menos de 6 horas, el dolor final fue ${summary.painDelta} punto${summary.painDelta === 1 ? "" : "s"} mas alto en promedio.`;
  }

  if (summary.relationship === "LOWER_AFTER_LOW_SLEEP") {
    return `En esta ventana corta, las noches de menos de 6 horas quedaron con dolor final ${Math.abs(summary.painDelta ?? 0)} punto${Math.abs(summary.painDelta ?? 0) === 1 ? "" : "s"} mas bajo en promedio.`;
  }

  return "Por ahora no se ve una diferencia clara entre sueno corto y dolor final del dia.";
}

export function buildWeeklyRecoveryStory(input: RecoveryInsightsInput) {
  return [
    buildPainTrendInsight(input.painTrend),
    buildReboundInsight(input.rebound),
    buildSleepPainInsight(input.sleepPain),
    buildWeeklyLoadInsight(input.weeklyLoad),
  ].join(" ");
}

function average(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }

  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

function formatWindowLabel(windowDays: number) {
  return `${windowDays} dias`;
}

export function buildSessionResponseReport(
  sessions: RehabSession[],
  windowDays: number,
  referenceDate?: Date | string,
) {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filtered = filterSessionsByRange(sessions, range);

  if (filtered.length === 0) {
    return "Todavia no hay sesiones recientes para resumir la respuesta post-terapia.";
  }

  const betterCount = filtered.filter((session) => session.finalState === "BETTER").length;
  const worseCount = filtered.filter((session) => session.finalState === "WORSE").length;
  const painDeltaAverage = average(
    filtered.map((session) => session.painAfter - session.painBefore),
  );

  return `En ${formatWindowLabel(windowDays)} hubo ${filtered.length} sesion${filtered.length === 1 ? "" : "es"}; ${betterCount} terminaron mejor y ${worseCount} peor. El cambio promedio entre dolor antes y despues fue ${painDeltaAverage ?? "--"} punto${painDeltaAverage === 1 || painDeltaAverage === -1 ? "" : "s"}.`;
}

export function buildReboundAssociationReport(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
  windowDays: number,
  referenceDate?: Date | string,
) {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filteredSessions = filterSessionsByRange(sessions, range);
  const reboundDates = new Set(
    filterCloseoutsByRange(closeouts, range)
      .filter((closeout) => closeout.reboundPainLevel !== "NONE")
      .map((closeout) => closeout.date),
  );
  const reboundSessions = filteredSessions.filter((session) =>
    reboundDates.has(getRecoveryDateKey(session.occurredAt)),
  );

  if (reboundSessions.length === 0) {
    return "En esta ventana no hay sesiones claramente asociadas a un cierre con rebote.";
  }

  const topExercises = calculateRecentExerciseFrequency(reboundSessions, windowDays, referenceDate)
    .slice(0, 3)
    .map((item) => item.name);

  return `Las sesiones que coincidieron con rebote fueron ${reboundSessions.length}. Los ejercicios que mas se repiten en ese grupo son: ${topExercises.join(", ")}.`;
}

export function buildSleepEnergyReport(
  closeouts: NightlyCloseout[],
  windowDays: number,
  referenceDate?: Date | string,
) {
  const range = getDateRangeForLastDays(windowDays, referenceDate);
  const filtered = filterCloseoutsByRange(closeouts, range);

  if (filtered.length === 0) {
    return "Todavia no hay cierres suficientes para resumir sueno y energia.";
  }

  const averageSleep = average(filtered.map((closeout) => closeout.sleepHours));
  const averageEnergy = average(filtered.map((closeout) => closeout.energy));

  return `En ${formatWindowLabel(windowDays)}, el sueno promedio fue ${averageSleep ?? "--"} h y la energia promedio ${averageEnergy ?? "--"}/5.`;
}

export function buildAppointmentQuestions(summary: MedicalReportSummary) {
  const questions: string[] = [];

  if (summary.painTrend.direction === "UP") {
    questions.push("Que cambios recientes conviene revisar si el dolor de cierre va subiendo?");
  }

  if (summary.highPainDays.length > 0) {
    questions.push("Hay algo en comun en los dias con dolor mas alto que valga la pena revisar en consulta?");
  }

  if (summary.reboundAssociationText.includes("coincidieron con rebote")) {
    questions.push("Estos ejercicios o combinaciones merecen algun ajuste cuando aparece rebote?");
  }

  if (summary.sleepEnergyText.includes("sueno promedio")) {
    questions.push("Conviene observar alguna relacion entre noches cortas, energia y respuesta del dia siguiente?");
  }

  if (questions.length === 0) {
    questions.push("Que variable conviene vigilar mejor en la siguiente semana: dolor, carga, rebote o sueno?");
  }

  return questions.slice(0, 3);
}

export function createMedicalReportSummary(
  sessions: RehabSession[],
  closeouts: NightlyCloseout[],
  windowDays: number,
  referenceDate?: Date | string,
): MedicalReportSummary {
  const dateRange = getDateRangeForLastDays(windowDays, referenceDate);
  const filteredCloseouts = filterCloseoutsByRange(closeouts, dateRange);
  const painTrend = calculatePainTrend(closeouts, windowDays, referenceDate);
  const averagePain = average(filteredCloseouts.map((closeout) => closeout.endOfDayPain));
  const highPainDays = filteredCloseouts
    .filter((closeout) => closeout.endOfDayPain >= 6)
    .sort((left, right) => right.endOfDayPain - left.endOfDayPain || left.date.localeCompare(right.date))
    .slice(0, 3)
    .map((closeout) => ({
      date: closeout.date,
      pain: closeout.endOfDayPain,
    }));
  const noteHighlights = [
    ...filteredCloseouts
      .map((closeout) => closeout.notes)
      .filter((note): note is string => typeof note === "string" && note.trim().length > 0),
    ...filterSessionsByRange(sessions, dateRange)
      .map((session) => session.notes)
      .filter((note): note is string => typeof note === "string" && note.trim().length > 0),
  ].slice(0, 4);

  const summary: MedicalReportSummary = {
    windowDays,
    dateRange,
    painTrend,
    averagePain,
    highPainDays,
    sessionResponseText: buildSessionResponseReport(sessions, windowDays, referenceDate),
    reboundAssociationText: buildReboundAssociationReport(
      sessions,
      closeouts,
      windowDays,
      referenceDate,
    ),
    sleepEnergyText: buildSleepEnergyReport(closeouts, windowDays, referenceDate),
    noteHighlights,
    appointmentQuestions: [],
  };

  summary.appointmentQuestions = buildAppointmentQuestions(summary);
  return summary;
}
