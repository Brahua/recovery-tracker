"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  addRecoveryDays,
  getRecoveryDateKey,
  recoveryTimeZone,
} from "@/lib/recovery-date";
import type { RitualSuccessConfig } from "@/lib/registrar-flow";
import type { NightlyCloseout, RehabSession } from "@/types/recovery";

function formatContext(dateKey: string, createdAt: string) {
  const date = new Date(`${dateKey}T12:00:00-05:00`);
  if (Number.isNaN(date.getTime())) return "Cierre del día";

  const today = getRecoveryDateKey();
  const relativeDate =
    dateKey === today
      ? "Hoy"
      : dateKey === addRecoveryDays(today, -1)
        ? "Ayer"
        : null;

  const parts = new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: recoveryTimeZone,
    weekday: "long",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  const dateLabel =
    relativeDate ?? `${part("weekday")} ${part("day")} de ${part("month")}`;
  return `${dateLabel} · registrado ${formatTime(createdAt)}`;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: recoveryTimeZone,
  }).format(date);
}

interface DayClosedStateProps extends RitualSuccessConfig {
  closeout: NightlyCloseout;
  session?: RehabSession;
  streak: number;
}

export function DayClosedState({
  body,
  closeout,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  session,
  streak,
  title,
}: DayClosedStateProps) {
  const [ringComplete, setRingComplete] = useState(false);
  const dayComplete = Boolean(session);
  const visibleStreak = Math.max(1, streak);

  useEffect(() => {
    if (!dayComplete) return;

    const timeout = window.setTimeout(() => setRingComplete(true), 400);
    return () => window.clearTimeout(timeout);
  }, [dayComplete]);

  return (
    <section className={`rr-day-closed ${dayComplete ? "is-complete" : "is-partial"}`}>
      <div aria-hidden="true" className="rr-day-closed-glow" />
      <div className="rr-day-closed-content">
        <p className="rr-day-closed-context">
          {formatContext(closeout.date, closeout.createdAt)}
        </p>

        <div
          aria-label={`${dayComplete ? 2 : 1} de 2 rituales completados`}
          className="rr-day-closed-ring"
          role="img"
        >
          <svg aria-hidden="true" viewBox="0 0 136 136">
            <circle className="rr-day-closed-ring-track" cx="68" cy="68" r="60" />
            <circle
              className="rr-day-closed-ring-value"
              cx="68"
              cy="68"
              r="60"
              style={{
                strokeDashoffset: dayComplete && ringComplete ? 0 : 188.5,
              }}
            />
          </svg>
          <span aria-hidden="true">☾</span>
        </div>

        <h1>{title}</h1>
        <p className="rr-day-closed-summary">{body}</p>

        <div className="rr-day-closed-details">
          <section aria-label="Rituales registrados" className="rr-day-closed-card">
            {session ? (
              <div className="rr-day-closed-row">
                <span aria-hidden="true">✓</span>
                <strong>Sesion de ejercicios</strong>
                <small>
                  {formatTime(session.occurredAt)} · {session.exercises.length} ejercicio
                  {session.exercises.length === 1 ? "" : "s"}
                </small>
              </div>
            ) : null}
            <div className="rr-day-closed-row">
              <span aria-hidden="true">✓</span>
              <strong>Cierre del dia</strong>
              <small>{formatTime(closeout.createdAt)} · dolor {closeout.endOfDayPain}</small>
            </div>
          </section>

          <p className="rr-day-closed-streak">
            Racha de <strong>{visibleStreak} dia{visibleStreak === 1 ? "" : "s"}</strong>
            {" · manana seguimos"}
          </p>
        </div>

        <div className="rr-day-closed-actions">
          <Link className="rr-day-closed-primary" href={primaryHref}>
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link className="rr-day-closed-secondary" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          ) : null}
          <Link className="rr-day-closed-secondary" href="/historial">
            Ver historial
          </Link>
        </div>
      </div>
    </section>
  );
}
