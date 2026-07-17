"use client";

import Link from "next/link";
import { useState } from "react";

import { HistoryCloseoutCard } from "@/features/history/history-closeout-card";
import {
  formatHistoryDay,
  formatHistoryRange,
} from "@/features/history/history-formatters";
import { HistorySessionCard } from "@/features/history/history-session-card";
import {
  getHistoryDaySummary,
  type HistoryDay,
} from "@/lib/history-view-model";

interface HistoryListProps {
  days: HistoryDay[];
  from: string;
  to: string;
  previousTo: string;
}

export function HistoryList({ days, from, to, previousTo }: HistoryListProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    days[0]?.sessions[0]?.id ?? null,
  );

  return (
    <section className="rr-history">
      <header className="rr-history-header">
        <div className="rr-history-heading">
          <p className="rr-kicker">Registro personal</p>
          <h1 className="rr-display">Historial</h1>
          <p>Todo lo que registraste, día a día. Solo lectura.</p>
        </div>
        <span className="rr-history-range">{formatHistoryRange(from, to)}</span>
      </header>

      <div className="rr-history-main">
        {days.length === 0 ? (
          <section className="rr-history-empty">
            <strong>No hay actividad en este periodo</strong>
            <p>Cuando registres una sesión o un cierre del día, aparecerá aquí.</p>
          </section>
        ) : (
          <div className="rr-history-days">
            {days.map((day) => (
              <section className="rr-history-day" key={day.date}>
                <header>
                  <h2>{formatHistoryDay(day.date)}</h2>
                  <span aria-hidden="true" />
                  <p>{getHistoryDaySummary(day)}</p>
                </header>

                <div className="rr-history-events">
                  {day.sessions.map((session) => (
                    <HistorySessionCard
                      expanded={expandedSessionId === session.id}
                      key={session.id}
                      onToggle={() => setExpandedSessionId((current) =>
                        current === session.id ? null : session.id)}
                      session={session}
                    />
                  ))}
                  {day.closeout && <HistoryCloseoutCard closeout={day.closeout} />}
                </div>
              </section>
            ))}
          </div>
        )}

        <Link className="rr-history-more" href={`/historial?before=${previousTo}`}>
          Ver 30 días anteriores
        </Link>
      </div>
    </section>
  );
}
