"use client";

import { useState } from "react";

export function ReportQuestions({ questions }: { questions: string[] }) {
  const [selected, setSelected] = useState(() => new Set(questions[0] ? [0] : []));

  function toggle(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="rr-report-questions">
      {questions.map((question, index) => {
        const checked = selected.has(index);
        return (
          <button
            aria-checked={checked}
            key={question}
            onClick={() => toggle(index)}
            role="checkbox"
            type="button"
          >
            <span aria-hidden="true" className={checked ? "is-checked" : ""}>
              {checked ? "✓" : ""}
            </span>
            <strong>{question}</strong>
          </button>
        );
      })}
      <p>Marca las que quieras llevar · apareceran al imprimir el reporte</p>
    </div>
  );
}
