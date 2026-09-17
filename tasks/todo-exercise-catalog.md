# Todo: Catálogo de ejercicios, isométricos y registro compacto

Spec: `docs/specs/exercise-catalog-spec.md`
Plan: `tasks/plan-exercise-catalog.md`

Regla: en la PC solo `npm run typecheck`, `npm run lint` y `npm test`. Las migraciones y los e2e se validan en CI.

## Phase 1: Base de datos y contrato

- [x] **T1: Migración del catálogo** (M)
  - Acceptance:
    - tabla `exercises` con `default_isometric`, defaults, `archived_at`, `normalized_name` llenado por trigger y RLS de 4 políticas
    - `session_exercises.exercise_id` (FK compuesta) e `is_isometric`
    - `session_exercise_sets.hold_seconds`, aceptado como contenido válido
    - `seed_default_exercises()` idempotente: Wall sit isométrico por defecto, Bicicleta 10 min
    - backfill para usuarios existentes y vínculo de `session_exercises` por `shortcut_id` o nombre
  - Verify: el CI del PR aplica todas las migraciones en su Supabase sin errores; `supabase:push:dry` lista solo esta migración.
  - Files: `supabase/migrations/2026MMDD000000_exercise_catalog.sql`
  - Deps: ninguna

- [x] **T2: Guardado atómico por RPC** (M)
  - Acceptance:
    - `create_rehab_session(payload jsonb)` resuelve cada ejercicio (id → nombre normalizado → crear) e inserta sesión, ejercicios y series en una transacción
    - `createRehabSession` del repositorio usa la RPC y ya no compensa borrando
    - los mappers leen `exercise_id`, `is_isometric` y `hold_seconds`
  - Verify: unitarios de mappers; los e2e actuales del registro pasan en CI.
  - Files: migración de T1 (RPC), `src/data/recovery-log-repository.ts`, `src/data/recovery-log-mappers.ts` (+ test)
  - Deps: T1

- [x] **T3: Contrato TS del registro** (M)
  - Acceptance:
    - tipos `Exercise`, `SessionExercise.exerciseId`, `isIsometric` y `ExerciseSet.holdSeconds`
    - Zod acepta `holdSeconds` (1–3600) y lo descarta si `isIsometric` es falso; una serie válida tiene repeticiones, peso, segundos o nota
    - `normalizeExerciseName` y `matchExercises` (prefijo primero, sin archivados, máximo 8)
    - `summarizeExercise`: `3 × 12 · 5 kg`, `3 × 45 s`, `10 min`
    - `applyExerciseDefaults`: solo llena campos vacíos
  - Verify: `npm test` con casos nuevos; `npm run typecheck`.
  - Files: `src/types/recovery.ts`, `src/lib/validation/recovery.ts` (+ test), `src/lib/exercise-name.ts` (+ test), `src/lib/exercise-summary.ts` (+ test), `src/lib/exercise-entry-state.ts` (+ test)
  - Deps: T2

### Checkpoint A
- [x] typecheck, lint y unitarios en verde en la PC
- [x] PR a `main` con CI en verde (migración + e2e actuales)
- [x] Revisión con el usuario

## Phase 2: Registro de sesión

- [x] **T4: Lecturas del catálogo en `/registrar`** (S)
  - Acceptance:
    - `exercise-repository` lista los ejercicios activos y los 8 más usados (completados en orden alfabético)
    - llama a `seed_default_exercises` si el usuario no tiene ejercicios
    - `/registrar` pasa el catálogo al formulario
  - Verify: unitario de más usados con relleno; typecheck.
  - Files: `src/data/exercise-repository.ts` (+ test), `src/app/registrar/page.tsx`, `src/features/check-in/post-therapy/form.tsx`
  - Deps: T1, T3

- [x] **T5: Lista compacta y modal de detalle** (M)
  - Acceptance:
    - una fila por ejercicio con resumen o aviso "Completar"
    - tocar la fila abre el modal (`<dialog>`, hoja inferior en móvil)
    - Escape y ✕ cierran y devuelven el foco
    - "Listo" y "Quitar" funcionan; cerrar no descarta cambios
  - Verify: typecheck y lint; e2e de apertura, cierre y foco en CI.
  - Files: `src/components/modal-sheet.tsx`, `src/components/exercise-entry-editor.tsx`, `src/app/globals.css`
  - Deps: T3

- [x] **T6: Buscador con autocompletado y más usados** (M)
  - Acceptance:
    - combobox ARIA con hasta 8 coincidencias, manejable con teclado
    - elegir fija el nombre, marca la casilla según el ejercicio y aplica los defaults
    - sin coincidencias ofrece `Crear "<texto>"`
    - no permite duplicar un ejercicio en la sesión
    - los botones de más usados agregan con defaults sin abrir el modal
  - Verify: e2e en CI: "glu" → Puente de gluteos, series autocompletadas; nombre nuevo guardado y visible en el catálogo.
  - Files: `src/components/exercise-name-combobox.tsx`, `src/components/exercise-entry-editor.tsx`, `src/app/globals.css`
  - Deps: T4, T5

- [x] **T7: Casilla isométrico y series compactas** (S)
  - Acceptance:
    - la casilla cambia los campos de serie (segundos y peso, con repeticiones opcionales)
    - desmarcar oculta los segundos sin borrarlos hasta cerrar
    - la nota por serie queda detrás de un botón
    - "+ Duración o distancia" se muestra abierto solo si ya hay valor
  - Verify: unitarios de completitud y payload con la casilla; e2e de Wall sit `3 × 45 s` en CI.
  - Files: `src/components/exercise-entry-editor.tsx`, `src/lib/exercise-entry-state.ts` (+ test), `src/app/globals.css`
  - Deps: T5

- [x] **T8: Historial e Insights** (S)
  - Acceptance:
    - el historial muestra `Serie 1 · 45 s`
    - Insights cuenta por `exerciseId` cuando existe (usando el nombre actual) y por nombre si no
    - no cuenta series como ejercicios
  - Verify: unitarios en `history-view-model`, `recovery-calculations` y `report-view-model`.
  - Files: `src/features/history/history-session-card.tsx`, `src/lib/history-view-model.ts` (+ test), `src/lib/recovery-calculations.ts` (+ test)
  - Deps: T2, T3

### Checkpoint B
- [x] CI en verde en el PR con los e2e del registro nuevo
- [x] Revisión visual con el usuario

## Phase 3: Mantenimiento

- [x] **T9: Pestaña y lista `/ejercicios`** (M)
  - Acceptance:
    - sexta pestaña "Ejercicios" sin scroll horizontal a 320 px
    - lista compacta con nombre, resumen de defaults y cantidad de sesiones
    - filtro por texto y pestañas Activos / Archivados
  - Verify: typecheck; e2e de navegación y filtro en CI.
  - Files: `src/components/app-shell.tsx`, `src/app/ejercicios/page.tsx`, `src/features/exercises/exercise-list.tsx`, `src/data/exercise-repository.ts`, `src/app/globals.css`
  - Deps: T4

- [x] **T10: Crear, editar y archivar** (M)
  - Acceptance:
    - modal con nombre, casilla "Isométrico por defecto" y defaults validados con Zod
    - un nombre duplicado muestra error sin perder lo escrito
    - renombrar no cambia el historial
    - archivar o reactivar lo quita o devuelve al buscador y a los más usados
  - Verify: unitarios del schema; e2e: crear, renombrar, archivar y ver que no aparece en el buscador.
  - Files: `src/features/exercises/exercise-form.tsx`, `src/features/exercises/actions.ts`, `src/lib/validation/exercises.ts` (+ test), `src/data/exercise-repository.ts`
  - Deps: T9

- [x] **T11: Fusionar ejercicios** (S)
  - Acceptance:
    - desde el modal de edición se elige el destino y se ve cuántas sesiones se reasignan
    - al confirmar, una función SQL transaccional reasigna `session_exercises` y elimina el origen
    - el destino conserva su nombre y defaults; el historial conserva los nombres copiados
  - Verify: e2e de fusión con historial intacto en CI.
  - Files: migración de T1 (`merge_exercises`), `src/features/exercises/merge-exercise.tsx`, `src/features/exercises/actions.ts`, `src/data/exercise-repository.ts`
  - Deps: T10

## Phase 4: Cierre

- [x] **T12: Retirar los atajos fijos, completar los e2e y actualizar la documentación** (M)
  - Acceptance:
    - el código ya no usa `exerciseShortcuts` ni `exerciseShortcutIds`; `shortcut_id` sigue en la base de datos
    - `tests/e2e/exercise-catalog.spec.ts` cubre los 6 escenarios de la spec
    - `post-therapy-check-in.spec.ts` está adaptado al modal
    - el estado de la spec pasa a implementada
  - Verify: typecheck, lint y unitarios locales; CI completo en verde.
  - Files: `src/lib/constants/exercises.ts`, `src/types/recovery.ts`, `tests/e2e/exercise-catalog.spec.ts`, `tests/e2e/post-therapy-check-in.spec.ts`, `docs/specs/exercise-catalog-spec.md`
  - Deps: T1–T11

### Checkpoint final
- [x] Criterios de éxito 1–10 de la spec cumplidos
- [x] Aprobación del usuario → merge a `main` → CI aplica la migración a staging y despliega
- [ ] Pendiente futuro (preguntar antes): migración que elimina `shortcut_id`
