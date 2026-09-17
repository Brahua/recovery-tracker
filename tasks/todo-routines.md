# Todo: Rutinas

Spec: `docs/specs/routines-spec.md`
Plan: `tasks/plan-routines.md`

Regla: en la PC solo `npm run typecheck`, `npm run lint` y `npm test`. La migración y los e2e se validan en CI, en un PR a `main`.

## Phase 1: Base

- [x] **R1: Migración de rutinas** (M)
  - Acceptance:
    - tablas `routines`, `routine_exercises` y `routine_exercise_sets` con FKs compuestas por `user_id`, rangos y RLS de 4 políticas cada una
    - `routines.normalized_name` llenado por trigger y único por usuario
    - `resolve_exercise_for_user(name, exercise_id)` compartido; `create_rehab_session` redefinida para usarlo sin cambiar su comportamiento
    - `save_routine(routine_id, payload)` crea o reemplaza en una transacción, rechaza repetidos y devuelve el id
    - `create_routine_from_session(session_id, name)` copia ejercicios vinculados, isométrico, duración, distancia y series sin notas
    - `merge_exercises` también reasigna `routine_exercises` sin generar repetidos
  - Verify: CI del PR aplica todas las migraciones; e2e existentes en verde.
  - Files: `supabase/migrations/20260918000000_routines.sql`
  - Deps: ninguna

- [x] **R2: Contrato TS y funciones puras** (M)
  - Acceptance:
    - tipos `Routine` y `RoutineExercise`
    - `routineInputSchema`: nombre 1–60, 1–20 ejercicios sin repetidos, plan parcial permitido
    - `routineToEntries`, `toRoutinePayload` y `addRoutineToSession` (omite repetidos, cuenta agregados y omitidos, usa defaults del catálogo si no hay plan)
    - `isEntryReady(entry, mode)`: en modo rutina basta con el nombre
  - Verify: `npm test` con casos nuevos; `npm run typecheck`.
  - Files: `src/types/recovery.ts`, `src/lib/routine-state.ts` (+ test), `src/lib/validation/routines.ts` (+ test), `src/lib/exercise-entry-state.ts` (+ test)
  - Deps: R1

- [x] **R3: Repositorio y acciones de servidor** (S)
  - Acceptance:
    - `routine-repository`: listar, obtener por id, guardar (RPC), eliminar y crear desde sesión
    - nombre duplicado mapeado a un error legible
    - acciones validan con Zod y revalidan `/ejercicios` y `/registrar`
  - Verify: unitarios de mappers; typecheck.
  - Files: `src/data/routine-repository.ts`, `src/data/recovery-log-mappers.ts` (+ test), `src/features/routines/actions.ts`
  - Deps: R2

### Checkpoint A
- [x] typecheck, lint y unitarios en verde en la PC
- [ ] PR a `main` con CI en verde (migración + e2e existentes)

## Phase 2: Gestión

- [x] **R4: Sección Rutinas en Ejercicios** (S)
  - Acceptance:
    - selector `Ejercicios | Rutinas` sincronizado con `?seccion=rutinas`
    - lista compacta con nombre, cantidad y primeros ejercicios
    - estado vacío y botón "+ Nueva rutina"
  - Verify: typecheck; e2e de navegación en R8.
  - Files: `src/app/ejercicios/page.tsx`, `src/features/exercises/exercise-catalog.tsx`, `src/features/routines/routine-list.tsx`, `src/app/globals.css`
  - Deps: R3

- [x] **R5: Página de rutina** (M)
  - Acceptance:
    - `/ejercicios/rutinas/nueva` y `/ejercicios/rutinas/[id]` con nombre y el editor en modo rutina ("Sin plan" permitido, sin "Usar rutina")
    - guardar vuelve a la sección Rutinas; nombre duplicado muestra error sin perder lo escrito
    - eliminar pide confirmación
    - una rutina inexistente o ajena muestra 404
  - Verify: unitarios de `isEntryReady`; e2e en R8.
  - Files: `src/app/ejercicios/rutinas/nueva/page.tsx`, `src/app/ejercicios/rutinas/[id]/page.tsx`, `src/features/routines/routine-editor.tsx`, `src/components/exercise-entry-editor.tsx`
  - Deps: R4

## Phase 3: Uso

- [x] **R6: Usar rutina en Registrar** (S)
  - Acceptance:
    - botón "Usar rutina" abre un modal con las rutinas
    - elegir una agrega sus ejercicios con el plan, omite los ya presentes y muestra `Se agregaron N … · M ya estaba(n)`
    - sin rutinas: enlace a crear una
  - Verify: unitarios de `addRoutineToSession`; e2e en R8.
  - Files: `src/app/registrar/page.tsx`, `src/features/check-in/post-therapy/form.tsx`, `src/components/exercise-entry-editor.tsx`, `src/features/routines/routine-picker.tsx`
  - Deps: R3

- [x] **R7: Guardar sesión como rutina** (S)
  - Acceptance:
    - botón en "Sesión hecha" que pide nombre (sugerido: tipo + fecha) y crea la rutina con la RPC
    - nombre duplicado muestra error; al terminar ofrece "Ver rutina"
  - Verify: e2e en R8.
  - Files: `src/components/session-saved-state.tsx`, `src/features/routines/save-session-as-routine.tsx`, `src/features/routines/actions.ts`
  - Deps: R3

## Phase 4: Cierre

- [x] **R8: E2E de rutinas y documentación** (M)
  - Acceptance:
    - `tests/e2e/routines.spec.ts` cubre los 5 escenarios de la spec
    - `e2e:critical` incluye el nuevo spec
    - estado de la spec actualizado
  - Verify: CI completo en verde en el PR.
  - Files: `tests/e2e/routines.spec.ts`, `tests/e2e/exercise-helpers.ts`, `package.json`, `docs/specs/routines-spec.md`
  - Deps: R4–R7

### Checkpoint final
- [ ] Criterios de éxito 1–8 cumplidos con CI en verde
- [ ] Aprobación del usuario → migración en staging (dry-run + push) → merge a `main`

## Seguimiento
- [x] E2E: nombre de rutina duplicado muestra error y conserva el borrador
- [x] E2E: rutina inexistente o ajena muestra 404 (RLS la filtra igual que un id inexistente)
- [x] E2E: cambiar valores al registrar no modifica la rutina (criterio de éxito 4)
