import { createNightlyCloseoutAction } from "@/features/check-in/nightly-closeout/actions";
import type { NightlyCloseout } from "@/types/recovery";

const painScale = Array.from({ length: 11 }, (_, value) => value);
const ratingScale = [1, 2, 3, 4, 5] as const;
const reboundOptions = [
  { value: "NONE", label: "Nada" },
  { value: "MILD", label: "Leve" },
  { value: "MODERATE", label: "Moderado" },
  { value: "STRONG", label: "Fuerte" },
] as const;

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function reboundLabel(value: NightlyCloseout["reboundPainLevel"]) {
  return reboundOptions.find((option) => option.value === value)?.label ?? value;
}

interface NightlyCloseoutFormProps {
  errorMessage?: string;
  successMessage?: string;
  recentCloseouts: NightlyCloseout[];
}

export function NightlyCloseoutForm({
  errorMessage,
  successMessage,
  recentCloseouts,
}: NightlyCloseoutFormProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <div className="section-card soft-panel rounded-[28px] border border-[#dfe5d8] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
              Cierre nocturno
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117] sm:text-3xl">
              Registra como termino el dia
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#526154] sm:text-base">
              Este cierre captura dolor final, energia, sueno y rebote tardio
              sin convertir el ritual en un formulario largo.
            </p>
          </div>
          <div className="rounded-full border border-[#dfe5d8] bg-[#f7f8f3] px-3 py-1 text-sm text-[#5d6b5f]">
            Menos de 1 minuto
          </div>
        </div>

        {successMessage ? (
          <div className="success-banner mt-6 rounded-2xl border p-4 text-sm leading-7 text-[#29412d]">
            <strong>Cierre guardado.</strong> {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="error-banner mt-6 rounded-2xl border p-4 text-sm leading-7 text-[#6b3024]">
            <strong>No se guardo el cierre.</strong> {errorMessage}
          </div>
        ) : null}

        <form
          action={createNightlyCloseoutAction}
          className="ritual-form mt-8 grid gap-8"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Fecha
              <input
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue={toDateValue(new Date())}
                name="date"
                required
                type="date"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Rebote desde la ultima sesion
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="NONE"
                name="reboundPainLevel"
                required
              >
                {reboundOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Dolor final del dia
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="3"
                name="endOfDayPain"
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
              Energia
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="3"
                name="energy"
                required
              >
                {ratingScale.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Horas de sueno
              <input
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="7.5"
                max="24"
                min="0"
                name="sleepHours"
                required
                step="0.5"
                type="number"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#263b29]">
              Calidad de sueno
              <select
                className="rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
                defaultValue="3"
                name="sleepQuality"
                required
              >
                {ratingScale.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-[#263b29]">
            Nota opcional
            <textarea
              className="min-h-[112px] rounded-2xl border border-[#d6ddd0] bg-[#fbfcf7] px-4 py-3 text-base text-[#18201a] outline-none transition focus:border-[#7da482]"
              name="notes"
              placeholder="Ej. el dolor subio al caminar en la noche, energia mejor que ayer, sin rigidez extra."
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-[#e4eadf] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-[#5d6b5f]">
              El rebote solo se registra como dolor tardio; no estamos mezclando
              rigidez o inflamacion en este cierre.
            </p>
            <button
              className="primary-button rounded-2xl bg-[#18201a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#243026]"
              type="submit"
            >
              Guardar cierre
            </button>
          </div>
        </form>
      </div>

      <aside className="section-card metric-panel grid gap-4 rounded-[28px] border border-[#dfe5d8] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#53735a]">
            Ultimos cierres
          </p>
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#162117]">
            Estabilidad del dia
          </h3>
          <p className="text-sm leading-7 text-[#526154]">
            Sirve para ver rapido como termino cada dia y si aparecio dolor
            tardio despues de una sesion.
          </p>
        </div>

        {recentCloseouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cdd8c8] bg-white/70 p-5 text-sm leading-7 text-[#5d6b5f]">
            Todavia no hay cierres nocturnos registrados en este entorno.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentCloseouts.map((closeout) => (
              <article
                className="rounded-2xl border border-[#d8e1d3] bg-white p-4"
                key={closeout.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1d2d20]">
                      {formatDate(closeout.date)}
                    </p>
                    <p className="text-xs text-[#5d6b5f]">
                      Rebote: {reboundLabel(closeout.reboundPainLevel)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#dbe4d5] px-3 py-1 text-xs text-[#48624d]">
                    Dolor {closeout.endOfDayPain}/10
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[#445546]">
                  <p>Energia: {closeout.energy}/5</p>
                  <p>Sueno: {closeout.sleepHours} h</p>
                  <p>Calidad de sueno: {closeout.sleepQuality}/5</p>
                  {closeout.notes ? <p>Nota: {closeout.notes}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </section>
  );
}
