"use client";

import { useId, useState } from "react";

import { findExerciseByName, matchExercises } from "@/lib/exercise-name";
import { summarizeExerciseDefaults } from "@/lib/exercise-summary";
import type { Exercise } from "@/types/recovery";

interface ExerciseNameComboboxProps {
  autoFocus?: boolean;
  catalog: Exercise[];
  excludeIds: string[];
  onRestore: (exercise: Exercise) => void;
  onSelect: (exercise: Exercise) => void;
  onValueChange: (value: string) => void;
  value: string;
}

type ComboboxOption =
  | { kind: "exercise"; exercise: Exercise }
  | { kind: "restore"; exercise: Exercise }
  | { kind: "create"; name: string };

export function ExerciseNameCombobox({
  autoFocus = false,
  catalog,
  excludeIds,
  onRestore,
  onSelect,
  onValueChange,
  value,
}: ExerciseNameComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = matchExercises(catalog, value, { excludeIds });
  const exactMatch = findExerciseByName(catalog, value);
  const alreadyInSession = Boolean(exactMatch && excludeIds.includes(exactMatch.id));
  const options: ComboboxOption[] = [
    ...matches.map((exercise) => ({ kind: "exercise" as const, exercise })),
    ...(exactMatch?.archivedAt && !alreadyInSession
      ? [{ kind: "restore" as const, exercise: exactMatch }]
      : []),
    ...(value.trim() && !exactMatch
      ? [{ kind: "create" as const, name: value.trim() }]
      : []),
  ];
  const expanded = open && options.length > 0;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  function choose(option: ComboboxOption) {
    if (option.kind === "exercise") {
      onSelect(option.exercise);
    } else if (option.kind === "restore") {
      onRestore(option.exercise);
    }
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (options.length === 0) return;
      setOpen(true);
      setActiveIndex((current) => {
        const step = event.key === "ArrowDown" ? 1 : -1;
        return (current + step + options.length) % options.length;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = options[activeIndex];
      if (expanded && option) {
        choose(option);
      } else if (exactMatch && !alreadyInSession) {
        choose({ kind: exactMatch.archivedAt ? "restore" : "exercise", exercise: exactMatch });
      } else {
        setOpen(false);
      }
      return;
    }

    if (event.key === "Escape" && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="rr-combobox">
      <label htmlFor={inputId}>Nombre del ejercicio</label>
      <input
        aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={expanded}
        autoComplete="off"
        data-autofocus={autoFocus || undefined}
        id={inputId}
        maxLength={80}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Busca o escribe uno nuevo"
        role="combobox"
        type="text"
        value={value}
      />
      <ul className="rr-combobox-list" hidden={!expanded} id={listId} role="listbox">
        {options.map((option, index) => (
          <li
            aria-selected={index === activeIndex}
            className={`${index === activeIndex ? "is-active" : ""} ${option.kind === "create" ? "is-create" : ""}`}
            id={optionId(index)}
            key={option.kind === "create" ? "create" : option.exercise.id}
            onMouseDown={(event) => {
              // Keep focus in the input so blur does not close the list first.
              event.preventDefault();
              choose(option);
            }}
            role="option"
          >
            {option.kind === "exercise" ? (
              <>
                <span>{option.exercise.name}</span>
                <small>
                  {summarizeExerciseDefaults(option.exercise) ||
                    (option.exercise.defaultIsometric ? "Isométrico" : "")}
                </small>
              </>
            ) : option.kind === "restore" ? (
              <>
                <span>Reactivar &ldquo;{option.exercise.name}&rdquo;</span>
                <small>Está archivado; volverá a tus ejercicios al guardar</small>
              </>
            ) : (
              <>
                <span>Crear &ldquo;{option.name}&rdquo;</span>
                <small>Se añadirá a tus ejercicios al guardar</small>
              </>
            )}
          </li>
        ))}
      </ul>
      {exactMatch && !open ? (
        <p className="rr-combobox-hint">
          {alreadyInSession
            ? "Este ejercicio ya está en la sesión."
            : exactMatch.archivedAt
              ? `Se reactivará “${exactMatch.name}” al guardar.`
              : `Se usará “${exactMatch.name}” de tus ejercicios.`}
        </p>
      ) : null}
    </div>
  );
}
