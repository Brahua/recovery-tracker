"use client";

export default function HistorialError({ reset }: { reset: () => void }) {
  return (
    <main className="rr-history">
      <section className="rr-card rr-history-empty" role="alert">
        <strong>No pudimos cargar el historial</strong>
        <p>Intenta nuevamente. Tus registros guardados no se modificaron.</p>
        <button className="rr-button rr-button--secondary rr-history-more" onClick={reset} type="button">
          Reintentar
        </button>
      </section>
    </main>
  );
}
