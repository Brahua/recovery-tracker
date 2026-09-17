"use client";

import { unexpectedErrorMessage } from "@/lib/action-feedback";

// Last resort for failures no form or action handled (e.g. the network dropped
// mid-submit): keep the shell and offer a retry instead of a blank screen.
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="rr-history">
      <section className="rr-card rr-history-empty" role="alert">
        <strong>Algo salió mal</strong>
        <p>{unexpectedErrorMessage} Lo que ya guardaste no se modificó.</p>
        <button className="rr-button rr-button--secondary rr-history-more" onClick={reset} type="button">
          Reintentar
        </button>
      </section>
    </div>
  );
}
