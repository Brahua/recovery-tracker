"use client";

export default function EjerciciosError({ reset }: { reset: () => void }) {
  return (
    <div className="rr-history">
      <section className="rr-card rr-history-empty" role="alert">
        <strong>No pudimos cargar tus ejercicios</strong>
        <p>Intenta nuevamente. Tus registros guardados no se modificaron.</p>
        <button className="rr-button rr-button--secondary rr-history-more" onClick={reset} type="button">
          Reintentar
        </button>
      </section>
    </div>
  );
}
