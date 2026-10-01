"use client";

import type { ComponentProps } from "react";

type DateFieldProps = Omit<ComponentProps<"input">, "className" | "type"> & {
  // What the row shows, e.g. "Hoy · 15:39"; the native value stays in the input.
  display: string;
  label: string;
  type: "date" | "datetime-local";
};

// One large row that is the date picker itself: the native input covers the row
// (transparent), so a tap opens the phone's picker directly.
export function DateField({ display, label, onClick, ...inputProps }: DateFieldProps) {
  return (
    <label className="rr-date-field">
      <svg aria-hidden="true" className="rr-date-field-icon" viewBox="0 0 24 24">
        <rect height="16" rx="3" width="18" x="3" y="5" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
      <span aria-hidden="true" className="rr-date-field-value">{display}</span>
      <span aria-hidden="true" className="rr-date-field-hint">Cambiar</span>
      <input
        {...inputProps}
        aria-label={label}
        className="rr-date-field-input"
        onClick={(event) => {
          onClick?.(event);
          // Phones open their picker on tap; with a mouse, open it from anywhere on the row.
          if (window.matchMedia("(pointer: fine)").matches) {
            try {
              event.currentTarget.showPicker();
            } catch {
              // Not supported or already open: the field still works by keyboard.
            }
          }
        }}
      />
    </label>
  );
}
