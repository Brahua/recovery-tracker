"use client";

import { treatmentZoneSuggestionsFor, type Condition } from "@/lib/condition";
import { createDraftId } from "@/lib/draft-id";
import {
  countValidTreatments,
  createTreatmentDraft,
  findRepeatedTreatmentIds,
  formatTreatmentCount,
  getTreatmentDraftError,
  maxTherapistNotesLength,
  maxTreatmentMinutes,
  maxTreatmentsPerSession,
  maxTreatmentTextLength,
  treatmentCatalog,
  treatmentLabel,
  treatmentTakesMinutes,
  type TreatmentDraft,
} from "@/lib/treatments";
import type { TreatmentCategory, TreatmentModality } from "@/types/recovery";

const zoneListId = "rr-treatment-zones";

interface TreatmentsCardProps {
  condition?: Condition | null;
  drafts: TreatmentDraft[];
  onChange: (drafts: TreatmentDraft[]) => void;
  therapistNotes: string;
  onTherapistNotesChange: (value: string) => void;
}

export function TreatmentsCard({
  condition,
  drafts,
  onChange,
  therapistNotes,
  onTherapistNotesChange,
}: TreatmentsCardProps) {
  const repeatedIds = findRepeatedTreatmentIds(drafts);
  const validCount = countValidTreatments(drafts);
  const isFull = drafts.length >= maxTreatmentsPerSession;
  const complete = drafts.length > 0 && validCount === drafts.length;

  function toggle(category: TreatmentCategory, modality: TreatmentModality) {
    const existing = drafts.find((draft) => draft.modality === modality);

    if (existing) {
      onChange(drafts.filter((draft) => draft.id !== existing.id));
      return;
    }

    if (!isFull) {
      onChange([...drafts, createTreatmentDraft(createDraftId("treatment"), category, modality)]);
    }
  }

  function addOther(category: TreatmentCategory) {
    if (!isFull) {
      onChange([...drafts, createTreatmentDraft(createDraftId("treatment"), category, "OTHER")]);
    }
  }

  function update(id: string, changes: Partial<TreatmentDraft>) {
    onChange(drafts.map((draft) => (draft.id === id ? { ...draft, ...changes } : draft)));
  }

  function remove(id: string) {
    onChange(drafts.filter((draft) => draft.id !== id));
  }

  return (
    <section aria-labelledby="rr-treatments-title" className="rr-form-card rr-treatments-card">
      <div className="rr-form-section-heading">
        <span aria-hidden="true" className={`rr-step-badge ${complete ? "is-complete" : ""}`}>
          {complete ? "✓" : ""}
        </span>
        <h2 id="rr-treatments-title">Tratamientos del centro</h2>
        <div>
          <b className="rr-treatments-count">
            {drafts.length === 0 ? "opcional" : formatTreatmentCount(validCount)}
          </b>
        </div>
      </div>
      <p className="rr-field-question">¿Qué te aplicaron en el centro?</p>

      {treatmentCatalog.map((group) => (
        <div className="rr-treatment-group" key={group.category}>
          <h3 id={`rr-treatment-group-${group.category}`}>{group.label}</h3>
          <div
            aria-labelledby={`rr-treatment-group-${group.category}`}
            className="rr-treatment-chips"
            role="group"
          >
            {group.options.map((option) => {
              const selected = drafts.some((draft) => draft.modality === option.modality);

              return (
                <button
                  aria-pressed={selected}
                  className={selected ? "is-selected" : ""}
                  disabled={!selected && isFull}
                  key={option.modality}
                  onClick={() => toggle(group.category, option.modality)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
            <button
              className="rr-treatment-chip-other"
              disabled={isFull}
              onClick={() => addOther(group.category)}
              type="button"
            >
              + Otro
            </button>
          </div>
        </div>
      ))}

      {isFull ? (
        <p className="rr-treatments-hint">
          Máximo {maxTreatmentsPerSession} tratamientos por sesión.
        </p>
      ) : null}

      {drafts.length > 0 ? (
        <ul aria-label="Tratamientos aplicados" className="rr-treatment-list">
          {drafts.map((draft) => {
            const error = repeatedIds.has(draft.id)
              ? "Este tratamiento ya está en la sesión."
              : getTreatmentDraftError(draft);
            const errorId = `${draft.id}-error`;
            const label = draft.modality === "OTHER" ? "Otro tratamiento" : treatmentLabel(draft);

            return (
              <li className={error ? "is-incomplete" : ""} key={draft.id}>
                <div className="rr-treatment-row-heading">
                  {draft.modality === "OTHER" ? (
                    <label className="rr-treatment-field rr-treatment-name">
                      <span>Nombre</span>
                      <input
                        aria-describedby={error ? errorId : undefined}
                        aria-invalid={Boolean(error)}
                        maxLength={maxTreatmentTextLength}
                        onChange={(event) => update(draft.id, { customName: event.target.value })}
                        placeholder="Ej. Indiba"
                        value={draft.customName}
                      />
                    </label>
                  ) : (
                    <strong>{label}</strong>
                  )}
                  <button
                    aria-label={`Quitar ${draft.modality === "OTHER" ? draft.customName.trim() || label : label}`}
                    className="rr-treatment-remove"
                    onClick={() => remove(draft.id)}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
                <div className="rr-treatment-fields">
                  <label className="rr-treatment-field">
                    <span>Zona</span>
                    <input
                      list={zoneListId}
                      maxLength={maxTreatmentTextLength}
                      onChange={(event) => update(draft.id, { bodyZone: event.target.value })}
                      placeholder="Opcional"
                      value={draft.bodyZone}
                    />
                  </label>
                  {treatmentTakesMinutes(draft.modality) ? (
                    <label className="rr-treatment-field rr-treatment-minutes">
                      <span>Min</span>
                      <input
                        aria-describedby={error ? errorId : undefined}
                        inputMode="numeric"
                        max={maxTreatmentMinutes}
                        min={1}
                        onChange={(event) =>
                          update(draft.id, { durationMinutes: event.target.value })
                        }
                        placeholder="—"
                        step={1}
                        type="number"
                        value={draft.durationMinutes}
                      />
                    </label>
                  ) : null}
                </div>
                {error ? (
                  <p className="rr-treatment-error" id={errorId}>
                    {error}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <datalist id={zoneListId}>
        {treatmentZoneSuggestionsFor(condition).map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>

      <label className="rr-treatment-field rr-therapist-notes">
        <span>Indicaciones del fisio (opcional)</span>
        <textarea
          maxLength={maxTherapistNotesLength}
          name="therapistNotes"
          onChange={(event) => onTherapistNotesChange(event.target.value)}
          placeholder="Ej. Bajar carga en sentadilla esta semana"
          value={therapistNotes}
        />
      </label>
    </section>
  );
}
