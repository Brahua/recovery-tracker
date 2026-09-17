"use client";

import Link from "next/link";
import { useState } from "react";

import { ModalSheet } from "@/components/modal-sheet";
import { ExerciseForm } from "@/features/exercises/exercise-form";
import { RoutineList } from "@/features/routines/routine-list";
import { normalizeExerciseName } from "@/lib/exercise-name";
import { summarizeExerciseDefaults } from "@/lib/exercise-summary";
import type { Exercise, Routine } from "@/types/recovery";

export type CatalogSection = "ejercicios" | "rutinas";

interface ExerciseCatalogProps {
  exercises: Exercise[];
  routines: Routine[];
  section: CatalogSection;
}

type Editing = { mode: "create" } | { mode: "edit"; id: string } | null;
type CatalogTab = "active" | "archived";

function ExerciseSection({
  exercises,
  onEdit,
}: {
  exercises: Exercise[];
  onEdit: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<CatalogTab>("active");

  const active = exercises.filter((exercise) => !exercise.archivedAt);
  const archived = exercises.filter((exercise) => exercise.archivedAt);
  const normalizedQuery = normalizeExerciseName(query);
  const visible = (tab === "active" ? active : archived).filter((exercise) =>
    normalizeExerciseName(exercise.name).includes(normalizedQuery),
  );

  return (
    <>
      <div className="rr-exercise-catalog-controls">
        <label className="rr-exercise-catalog-search">
          <span className="rr-visually-hidden">Buscar ejercicio</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ejercicio"
            type="search"
            value={query}
          />
        </label>
        <div aria-label="Estado de los ejercicios" className="rr-exercise-catalog-tabs" role="group">
          <button aria-pressed={tab === "active"} onClick={() => setTab("active")} type="button">
            Activos <b>{active.length}</b>
          </button>
          <button aria-pressed={tab === "archived"} onClick={() => setTab("archived")} type="button">
            Archivados <b>{archived.length}</b>
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rr-exercise-catalog-empty">
          {query.trim()
            ? "Ningún ejercicio coincide con la búsqueda."
            : tab === "active"
              ? "Aún no tienes ejercicios activos."
              : "No hay ejercicios archivados."}
        </p>
      ) : (
        <ul aria-label="Lista de ejercicios" className="rr-exercise-rows">
          {visible.map((exercise) => {
            const summary = summarizeExerciseDefaults(exercise);

            return (
              <li key={exercise.id}>
                <button className="rr-exercise-row" onClick={() => onEdit(exercise.id)} type="button">
                  <span className="rr-exercise-row-name">
                    <strong>{exercise.name}</strong>
                    {exercise.defaultIsometric ? <em>Isométrico</em> : null}
                  </span>
                  <span className="rr-exercise-row-summary">
                    {summary || <small>Sin valores</small>}
                    <small>
                      {exercise.sessionCount} sesi{exercise.sessionCount === 1 ? "ón" : "ones"}
                    </small>
                  </span>
                  <b aria-hidden="true">›</b>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function ExerciseCatalog({ exercises, routines, section }: ExerciseCatalogProps) {
  const [editing, setEditing] = useState<Editing>(null);

  const activeCount = exercises.filter((exercise) => !exercise.archivedAt).length;
  const editingExercise =
    editing?.mode === "edit"
      ? exercises.find((exercise) => exercise.id === editing.id)
      : undefined;
  const modalOpen = editing?.mode === "create" || Boolean(editingExercise);

  return (
    <section className="rr-exercise-catalog">
      <header className="rr-exercise-catalog-header">
        <div>
          <p className="rr-kicker">Tu catálogo</p>
          <h1 className="rr-display">Ejercicios</h1>
          <p>
            {section === "rutinas"
              ? "Agrupa ejercicios con su plan para registrar sesiones repetidas en un toque."
              : "Define nombres y valores por defecto para registrar más rápido."}
          </p>
        </div>
        {section === "rutinas" ? (
          <Link className="rr-modal-primary rr-link-button" href="/ejercicios/rutinas/nueva">
            + Nueva rutina
          </Link>
        ) : (
          <button className="rr-modal-primary" onClick={() => setEditing({ mode: "create" })} type="button">
            + Nuevo
          </button>
        )}
      </header>

      <nav aria-label="Secciones de ejercicios" className="rr-exercise-catalog-tabs">
        <Link aria-current={section === "ejercicios" ? "page" : undefined} href="/ejercicios">
          Ejercicios <b>{activeCount}</b>
        </Link>
        <Link aria-current={section === "rutinas" ? "page" : undefined} href="/ejercicios?seccion=rutinas">
          Rutinas <b>{routines.length}</b>
        </Link>
      </nav>

      {section === "rutinas" ? (
        <RoutineList routines={routines} />
      ) : (
        <ExerciseSection exercises={exercises} onEdit={(id) => setEditing({ mode: "edit", id })} />
      )}

      <ModalSheet
        onClose={() => setEditing(null)}
        open={modalOpen}
        title={editingExercise ? "Editar ejercicio" : "Nuevo ejercicio"}
      >
        {modalOpen ? (
          <ExerciseForm
            exercise={editingExercise}
            exercises={exercises}
            key={editingExercise?.id ?? "create"}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ModalSheet>
    </section>
  );
}
