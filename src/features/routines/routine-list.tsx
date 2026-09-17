import Link from "next/link";

import type { Routine } from "@/types/recovery";

export function formatRoutinePreview(routine: Routine, limit = 3) {
  const names = routine.exercises.map((exercise) => exercise.name);
  const preview = names.slice(0, limit).join(" · ");
  return names.length > limit ? `${preview}…` : preview;
}

export function formatExerciseCount(count: number) {
  return `${count} ejercicio${count === 1 ? "" : "s"}`;
}

export function RoutineList({ routines }: { routines: Routine[] }) {
  if (routines.length === 0) {
    return (
      <div className="rr-exercise-catalog-empty">
        <strong>Crea tu primera rutina</strong>
        <p>
          Agrupa los ejercicios que repites. También puedes guardar una sesión registrada como
          rutina desde la pantalla &ldquo;Sesión hecha&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <ul aria-label="Lista de rutinas" className="rr-exercise-rows">
      {routines.map((routine) => (
        <li key={routine.id}>
          <Link className="rr-exercise-row rr-routine-row" href={`/ejercicios/rutinas/${routine.id}`}>
            <span className="rr-routine-row-text">
              <strong>{routine.name}</strong>
              <small>{formatRoutinePreview(routine)}</small>
            </span>
            <span className="rr-exercise-row-summary">{formatExerciseCount(routine.exercises.length)}</span>
            <b aria-hidden="true">›</b>
          </Link>
        </li>
      ))}
    </ul>
  );
}
