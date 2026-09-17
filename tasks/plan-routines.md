# Implementation Plan: Rutinas

Spec: `docs/specs/routines-spec.md` (aprobada 2026-09-17)
Tareas: `tasks/todo-routines.md`

## Overview

Agregar rutinas por usuario: plantillas con nombre y ejercicios del catálogo, cada uno con su plan. Se gestionan en `Ejercicios → Rutinas`, se usan desde Registrar (agregando ejercicios y omitiendo los que ya están) y se pueden crear a partir de una sesión guardada.

## Estado actual relevante

- **Editor de ejercicios** (`src/components/exercise-entry-editor.tsx`):
  - lista compacta, modal, buscador y botones de más usados
  - serializa `exercisesPayload` y detecta repetidos con `findRepeatedEntryIds`
  - hoy asume contexto de sesión: una entrada sin series queda incompleta
- **Estado puro** (`src/lib/exercise-entry-state.ts`): `applyExerciseDefaults`, `resolveEntryExerciseId`, `toExercisePayload`.
- **Guardado atómico por RPC:** `create_rehab_session` resuelve ejercicios por id, luego por nombre normalizado (reactivando archivados), si no existe lo crea, y rechaza repetidos. `save_routine` seguirá el mismo patrón.
- **Fusión:** `merge_exercises` está en `20260917000000_exercise_catalog.sql`, **ya aplicada en staging**, así que no se modifica: se reemplaza con `create or replace` en la migración nueva.
- **Pestaña Ejercicios:** `src/app/ejercicios/page.tsx` + `src/features/exercises/exercise-catalog.tsx`.
- **Sesión guardada:** `src/components/session-saved-state.tsx` es un componente de servidor; el botón nuevo va en un componente cliente dentro de él.
- **Next 16:** `params` y `searchParams` son `Promise` en páginas dinámicas.

## Architecture Decisions

- **Tres tablas relacionales** (`routines`, `routine_exercises`, `routine_exercise_sets`) en vez de JSON. Así la base de datos valida rangos y claves, RLS funciona igual que en las sesiones, y la fusión actualiza una columna `exercise_id`.
- **Guardar la rutina completa en cada edición.** `save_routine(routine_id, payload)` borra y vuelve a insertar ejercicios y series en una transacción, en lugar de calcular diferencias. Las rutinas son pequeñas (máximo 20 ejercicios), así que es simple y seguro.
- **Resolver ejercicios en SQL con un helper compartido.** Extraer `resolve_exercise_for_user(name, exercise_id)` para que `create_rehab_session` y `save_routine` usen la misma lógica. `create_rehab_session` se redefine en la migración nueva para usarlo, sin cambiar su comportamiento.
- **Mismo editor con un modo.** `ExerciseEntryEditor` recibe `mode: "session" | "routine"`:
  - en modo rutina se acepta un ejercicio sin series ("Sin plan") y no aparece "Usar rutina"
  - la regla de completitud pasa a una función pura `isEntryReady(entry, mode)`, en lugar de condicionales repartidos por el componente
- **Rutina en el cliente = borradores del editor.** `routineToEntries` y `toRoutinePayload` convierten entre `Routine` y `ExerciseEntryDraft[]`. `addRoutineToSession` es una función pura que omite repetidos y usa los valores por defecto del catálogo si no hay plan.
- **Páginas para editar y modal solo para elegir.** La edición vive en `/ejercicios/rutinas/nueva` y `/ejercicios/rutinas/[id]` (evita modales apilados). "Usar rutina" es un `ModalSheet` con la lista, porque solo selecciona.
- **Sección en la URL:** `/ejercicios?seccion=rutinas`, leída en el servidor, para que "volver" y los enlaces caigan en la sección correcta.
- **Crear desde sesión en SQL:** `create_routine_from_session(session_id, name)` copia en la base de datos los ejercicios vinculados, `is_isometric`, duración, distancia y series (sin notas). Evita volver a mandar la sesión desde el cliente.
- **Nada pesado en local** y PR a `main` con CI antes de aplicar la migración en staging.

## Dependency Graph

```
R1 Migración (tablas, RLS, resolver compartido, save_routine, desde sesión, merge ampliado)
 ├─ R2 Contrato TS: tipos, Zod, conversiones puras, addRoutineToSession
 │    ├─ R3 Repositorio + acciones de servidor
 │    │    ├─ R4 Sección Rutinas en Ejercicios (lista)
 │    │    │    └─ R5 Página crear/editar/eliminar rutina (editor en modo rutina)
 │    │    ├─ R6 "Usar rutina" en Registrar
 │    │    └─ R7 "Guardar como rutina" en Sesión hecha
 └──────────────── R8 E2E + docs
```

## Task List

### Phase 1: Base

- [ ] R1: Migración de rutinas
- [ ] R2: Contrato TS y funciones puras
- [ ] R3: Repositorio y acciones de servidor

### Checkpoint A
- [ ] typecheck, lint y unitarios en verde en la PC
- [ ] PR abierto: CI aplica la migración y los e2e existentes siguen en verde (el `create_rehab_session` redefinido no rompe el registro)

### Phase 2: Gestión

- [ ] R4: Sección Rutinas en Ejercicios
- [ ] R5: Página de rutina

### Phase 3: Uso

- [ ] R6: Usar rutina en Registrar
- [ ] R7: Guardar sesión como rutina

### Phase 4: Cierre

- [ ] R8: E2E de rutinas y documentación

### Checkpoint final
- [ ] Criterios de éxito 1–8 de la spec cumplidos, con CI en verde en el PR
- [ ] Con tu aprobación: migración en staging (dry-run + push) y después merge a `main`

## Risks and Mitigations

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Redefinir `create_rehab_session` rompe el registro que ya está en staging | Alto | Mismo contrato y mismos mensajes de error; los e2e actuales del registro deben pasar en el Checkpoint A antes de seguir. |
| La fusión deja la misma rutina con el ejercicio repetido y viola `unique (routine_id, exercise_id)` | Medio | En `merge_exercises`, borrar primero las filas del origen en rutinas que ya tienen el destino y después reasignar. E2E dedicado. |
| El modo rutina agrega condicionales al editor y lo complica | Medio | Completitud en una función pura por modo, con unitarios; el componente solo recibe `mode`. Si crece, extraer `ExerciseDetail` a su propio archivo (ya estaba sugerido en el CR). |
| `save_routine` borra y reinserta: una edición concurrente en dos pestañas pierde cambios | Bajo | Aceptable para un solo usuario; gana la última escritura. |
| Guardar una sesión con ejercicios sin vincular (registros antiguos) | Bajo | El backfill ya vinculó todo; `create_routine_from_session` omite los que no tengan `exercise_id`. |
| Aplicar la migración antes de validarla | Alto | Solo después de CI en verde y con tu aprobación, igual que con el catálogo. |

## Open Questions

Ninguna.
