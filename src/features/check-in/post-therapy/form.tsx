import { createPostTherapySessionAction } from "@/features/check-in/post-therapy/actions";
import { exerciseShortcuts } from "@/lib/constants/exercises";
import type { RehabSession } from "@/types/recovery";

const sessionTypeOptions = [
  { value: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { value: "HOME", label: "Casa" },
  { value: "HYDROTHERAPY", label: "Hidroterapia" },
  { value: "GYM", label: "Gym" },
  { value: "WALK", label: "Caminata" },
  { value: "OTHER", label: "Otro" },
] as const;

const finalStateOptions = [
  { value: "BETTER", label: "Mejor" },
  { value: "SAME", label: "Igual" },
  { value: "WORSE", label: "Peor" },
] as const;

const painScale = Array.from({ length: 11 }, (_, value) => value);
const loadScale = [1, 2, 3, 4, 5] as const;

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatSessionDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function finalStateLabel(value: RehabSession["finalState"]) {
  return finalStateOptions.find((option) => option.value === value)?.label ?? value;
}

function sessionTypeLabel(value: RehabSession["sessionType"]) {
  return sessionTypeOptions.find((option) => option.value === value)?.label ?? value;
}

interface PostTherapyFormProps {
  errorMessage?: string;
  successMessage?: string;
  recentSessions: RehabSession[];
}

export function PostTherapyForm({
  errorMessage,
  successMessage,
  recentSessions,
}: PostTherapyFormProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="section-card soft-panel rounded-[28px] border border-[#dfe5d8] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
              Check-in post-terapia
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117] sm:text-3xl">
              Registra como respondio la rodilla hoy
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#526154] sm:text-base">
              El objetivo es dejar una sesion clara en menos de dos minutos:
              fecha, dolor, carga percibida, ejercicios principales y sensacion
              final.
            </p>
          </div>
          <div className="rounded-full border border-[#dfe5d8] bg-[#f7f8f3] px-3 py-1 text-sm text-[#5d6b5f]">
            Persistencia real
          </div>
        </div>

        {successMessage ? (
          <div className="success-banner mt-6 rounded-2xl border p-4 text-sm leading-7 text-[#29412d]">
            <strong>Sesion guardada.</strong> {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="error-banner mt-6 rounded-2xl border p-4 text-sm leading-7 text-[#6b3024]">
            <strong>No se guardo la sesion.</strong> {errorMessage}
          </div>
        ) : null}

        <form action={createPostTherapySessionAction} className="ritual-form mt-8 grid gap-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Fecha y hora
              <input
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none ring-0 transition focus:border-[#7da482]"
                defaultValue={toDateTimeLocalValue(new Date())}
                name="occurredAt"
                required
                type="datetime-local"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Tipo de sesion
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="PHYSIOTHERAPY"
                name="sessionType"
                required
              >
                {sessionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Dolor antes
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="3"
                name="painBefore"
                required
              >
                {painScale.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Dolor durante
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue=""
                name="painDuring"
              >
                <option value="">Sin registrar</option>
                {painScale.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Dolor despues
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="3"
                name="painAfter"
                required
              >
                {painScale.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Carga percibida
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="3"
                name="perceivedLoad"
                required
              >
                {loadScale.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#263b29]">
                Ejercicios principales
              </p>
              <p className="text-sm leading-6 text-[#5d6b5f]">
                Marca los shortcuts usados hoy. Puedes agregar un ejercicio libre
                abajo si hiciste algo fuera de esta lista.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {exerciseShortcuts.map((shortcut) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#dfe5d8] bg-[#f7f8f3] px-4 py-3 text-sm text-[#263b29]"
                  key={shortcut.id}
                >
                  <input
                    className="h-4 w-4 rounded border-[#c5d2bf] text-[#2b5a35]"
                    name="exerciseShortcuts"
                    type="checkbox"
                    value={shortcut.id}
                  />
                  <span>{shortcut.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-5 rounded-[24px] border border-[#dfe5d8] bg-[#fbfcf7] p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#263b29]">
                Ejercicio libre opcional
              </p>
              <p className="text-sm leading-6 text-[#5d6b5f]">
                Solo llena esto si quieres registrar un ejercicio adicional.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-[1.2fr_0.4fr_0.4fr_0.4fr]">
              <label className="grid gap-2 text-sm font-medium text-[#263b29]">
                Nombre
                <input
                  className="rounded-2xl border border-[#d6ddd0] bg-white px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                  name="customExerciseName"
                  placeholder="Ej. prensa, bici estatica, puente"
                  type="text"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#263b29]">
                Series
                <input
                  className="rounded-2xl border border-[#d6ddd0] bg-white px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                  min="1"
                  name="customExerciseSets"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#263b29]">
                Reps
                <input
                  className="rounded-2xl border border-[#d6ddd0] bg-white px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                  min="1"
                  name="customExerciseReps"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#263b29]">
                Peso
                <input
                  className="rounded-2xl border border-[#d6ddd0] bg-white px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                  min="0"
                  name="customExerciseWeight"
                  step="0.5"
                  type="number"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[0.6fr_1fr]">
            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Como terminaste
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="SAME"
                name="finalState"
                required
              >
                {finalStateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Nota corta opcional
              <textarea
                className="min-h-[112px] rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                name="notes"
                placeholder="Ej. step-down se sintio pesado, buena tolerancia a la bici, sin rebote inmediato."
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e4eadf] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-[#5d6b5f]">
              Al guardar, la sesion queda persistida y reaparece abajo aunque
              recargues la pagina.
            </p>
            <button
              className="primary-button rounded-2xl bg-[#18201a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#243026]"
              type="submit"
            >
              Guardar sesion
            </button>
          </div>
        </form>
      </div>

      <aside className="section-card metric-panel grid gap-4 rounded-[28px] border border-[#dfe5d8] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
            Ultimas sesiones
          </p>
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117]">
            Persistencia visible
          </h3>
          <p className="text-sm leading-7 text-[#526154]">
            Este bloque sirve como prueba directa de que el registro queda
            guardado y vuelve a aparecer tras recargar.
          </p>
        </div>

        {recentSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cdd8c8] bg-white/70 p-5 text-sm leading-7 text-[#5d6b5f]">
            Todavia no hay sesiones registradas en este entorno.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentSessions.map((session) => (
              <article
                className="rounded-2xl border border-[#d8e1d3] bg-white p-4"
                key={session.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1d2d20]">
                      {sessionTypeLabel(session.sessionType)}
                    </p>
                    <p className="text-xs text-[#5d6b5f]">
                      {formatSessionDate(session.occurredAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#dbe4d5] px-3 py-1 text-xs text-[#48624d]">
                    {finalStateLabel(session.finalState)}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[#445546]">
                  <p>
                    Dolor: {session.painBefore} → {session.painAfter}
                  </p>
                  <p>Carga percibida: {session.perceivedLoad}/5</p>
                  <p>
                    Ejercicios:{" "}
                    {session.exercises.map((exercise) => exercise.name).join(", ")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </section>
  );
}
