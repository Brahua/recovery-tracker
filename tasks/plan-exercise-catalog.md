# Implementation Plan: Catálogo de ejercicios, isométricos y registro compacto

Spec: `docs/specs/exercise-catalog-spec.md` (aprobada 2026-09-16)
Tareas: `tasks/todo-exercise-catalog.md`

Nota de implementación: `merge_exercises` quedó en la misma migración que el catálogo (una sola migración por aplicar).

## Overview

Reemplazar la lista fija de atajos por un catálogo de ejercicios por usuario, con autocompletado y valores por defecto al registrar, registro isométrico por casilla (segundos por serie), una sección de ejercicios compacta con modal de detalle y una pestaña `/ejercicios` para mantener el catálogo.

## Estado actual relevante

- **Guardado:** `createRehabSession` en `src/data/recovery-log-repository.ts:211` inserta la sesión, luego los ejercicios y luego las series. Si falla, borra la sesión (compensación, no transacción).
- **Payload:** el editor `src/components/exercise-entry-editor.tsx` serializa un JSON oculto (`exercisesPayload`). `src/features/check-in/post-therapy/actions.ts:83` lo parsea y `src/lib/validation/recovery.ts` lo valida con Zod.
- **Estado del editor:** funciones puras en `src/lib/exercise-entry-state.ts`.
- **Atajos fijos:**
  - IDs en `src/types/recovery.ts`
  - nombres en `src/lib/constants/exercises.ts`
  - check SQL en `session_exercises.shortcut_id`
- **Insights:** cuenta ejercicios por nombre (`src/lib/recovery-calculations.ts:275`).
- **Historial:** muestra repeticiones y peso en `src/features/history/history-session-card.tsx`.
- **Navegación:** 5 pestañas en `src/components/app-shell.tsx`.
- **CI** (`.github/workflows/ci-cd.yml`):
  - en push o PR a `main` corre lint, typecheck, unitarios y e2e con un Supabase propio del runner, que aplica todas las migraciones
  - solo en push a `main` aplica las migraciones a staging y despliega a Vercel

## Architecture Decisions

- **Guardado atómico con RPC.** La función Postgres `create_rehab_session(payload jsonb)`, con `security invoker`, crea los ejercicios nuevos del catálogo, la sesión, los ejercicios de sesión y las series en una transacción. Reemplaza la compensación actual y hace imposible un ejercicio nuevo huérfano. RLS sigue aplicando porque corre como el usuario.
- **Resolver ejercicios en SQL, no en el cliente.** Para cada ejercicio del payload, la RPC:
  1. usa el `exerciseId` si viene
  2. si no, busca por `normalized_name`
  3. si no existe, lo crea
  
  Así no se crean duplicados por escritura, aunque se abran dos pestañas a la vez (`unique (user_id, normalized_name)` + `on conflict`).
- **Una sola normalización.** `normalize_exercise_name` en SQL (`lower` + `unaccent` + espacios colapsados) y `normalizeExerciseName` en TS deben dar el mismo resultado. Un test unitario fija los casos (tildes, ñ, espacios, mayúsculas). La columna la llena un trigger, así el cliente nunca decide la normalización.
- **Catálogo inicial idempotente.** `seed_default_exercises()` usa `auth.uid()` e `insert ... on conflict do nothing`. La migración lo aplica a los usuarios existentes. La app lo llama al cargar `/registrar` o `/ejercicios` si el usuario no tiene ejercicios.
- **Búsqueda en el cliente.** El catálogo de un usuario es pequeño (decenas). `/registrar` lo carga una vez y `matchExercises` filtra en memoria: cumple los 200 ms sin llamadas por tecla.
- **Más usados en SQL.** `count(distinct session_id)` por `exercise_id` sobre ejercicios activos, completado en orden alfabético en TS.
- **Modal con `<dialog>` nativo** y combobox ARIA propio. Sin dependencias nuevas.
- **Compatibilidad durante la transición.** `shortcut_id` se mantiene en la base de datos y el código deja de escribirlo. Eliminarlo queda fuera de este plan: requiere preguntar antes.
- **Next.js del repo.** Antes de las tareas con Server Actions, páginas nuevas o `searchParams`, leer la guía correspondiente en `node_modules/next/dist/docs/`, según `AGENTS.md`.
- **Nada pesado en local.** En la PC solo se corren typecheck, lint y unitarios. Migraciones y e2e se validan en CI.

## Dependency Graph

```
T1 Migración (tablas, RLS, seed, backfill, normalización)
 └─ T2 RPC de guardado + repositorio + mappers
      ├─ T3 Contrato TS: tipos, validación, payload, estado del editor
      │    └─ T5 Lista compacta + modal
      │         ├─ T6 Buscador con autocompletado + más usados   ← T4
      │         └─ T7 Casilla isométrico + series compactas
      └─ T4 Lecturas de catálogo (listar, más usados, seed perezoso)
           └─ T9 /ejercicios lista + sexta pestaña
                └─ T10 Crear / editar / archivar
                     └─ T11 Fusionar
T8 Historial e Insights  ← T2, T3
T12 Limpieza de atajos fijos + e2e + docs  ← todo lo anterior
```

## Task List

### Phase 1: Base de datos y contrato

- [x] T1: Migración del catálogo
- [x] T2: Guardado atómico por RPC
- [x] T3: Contrato TS del registro

### Checkpoint A: Base

- [x] typecheck, lint y unitarios en verde en la PC
- [x] **PR a `main`** (sin merge): CI aplica la migración en su Supabase y corre los e2e actuales en verde. El registro actual, adaptado al nuevo payload, sigue funcionando.
- [x] Revisión contigo antes de seguir

### Phase 2: Registro de sesión

- [x] T4: Lecturas del catálogo en `/registrar`
- [x] T5: Lista compacta y modal de detalle
- [x] T6: Buscador con autocompletado y más usados
- [x] T7: Casilla isométrico y series compactas
- [x] T8: Historial e Insights

### Checkpoint B: Registro completo

- [x] CI en verde en el PR, con e2e del registro nuevo
- [x] Revisión visual contigo sobre la preview o staging

### Phase 3: Mantenimiento

- [x] T9: Pestaña y lista `/ejercicios`
- [x] T10: Crear, editar y archivar
- [x] T11: Fusionar ejercicios

### Phase 4: Cierre

- [x] T12: Retirar los atajos fijos, completar los e2e y actualizar la documentación

### Checkpoint final

- [x] Todos los criterios de éxito de la spec cumplidos
- [x] Contigo: merge a `main` → CI aplica la migración a staging y despliega

## Risks and Mitigations

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La extensión `unaccent` no está habilitada en staging | Alto | `create extension if not exists unaccent with schema extensions` en la migración; el CI la valida en su Supabase antes del merge. |
| La normalización SQL y la TS difieren y el buscador muestra un "Crear" que luego se vincula a otro | Medio | Casos compartidos en un test unitario; la RPC es la fuente de verdad al guardar. |
| No se puede probar la migración en local | Medio | PR a `main` para que CI la aplique en su Supabase; dry-run antes del merge. |
| La RPC rompe el guardado existente | Alto | T2 mantiene el formulario actual funcionando con el nuevo payload antes de tocar la UI. Los e2e actuales deben pasar en el Checkpoint A. |
| Seis pestañas no caben a 320 px | Medio | Etiquetas cortas o solo icono con `aria-label` bajo cierto ancho; verificar en la preview. |
| El merge a `main` aplica la migración a staging sin revisión | Alto | Merge solo con tu aprobación explícita en el Checkpoint final. |
| El modal atrapa mal el foco en iOS Safari | Bajo | `<dialog>` nativo con `showModal()`; e2e de apertura, Escape y retorno de foco. |

## Open Questions

1. **Usar un PR para validar en CI antes del merge.** Hasta ahora se integraba directo a `main`, pero así la migración llegaría a staging sin validar. Recomiendo abrir un PR (el CI corre sin desplegar) y hacer merge al final. ¿De acuerdo?
