"use client";

import { useState } from "react";

export function ReportActions() {
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");

  function printReport() {
    window.print();
  }

  async function shareReport() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Reporte de recuperacion",
          text: "Resumen de mi seguimiento de recuperacion.",
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("error");
    }
  }

  return (
    <div className="rr-report-action-bar" data-print-hidden="true">
      <div>
        <button className="rr-report-print" onClick={printReport} type="button">
          Generar PDF
        </button>
        <button
          aria-label={shareState === "copied" ? "Enlace copiado" : "Compartir reporte"}
          className="rr-report-share"
          onClick={shareReport}
          type="button"
        >
          {shareState === "copied" ? "✓" : shareState === "error" ? "!" : "↗"}
        </button>
      </div>
    </div>
  );
}
