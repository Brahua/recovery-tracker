# Spec: Catálogo de ejercicios, isométricos y registro compacto

## Estado

Aprobada el 2026-09-16. Implementada y desplegada en staging el 2026-09-17 (PR #1). La migración `20260917000000_exercise_catalog.sql` incluye también la función de fusión.

## Decisiones validadas

1. El catálogo es **por usuario**, protegido con RLS como el resto de tablas.
2. Cada usuario, nuevo o existente, empieza con los **10 ejercicios actuales**.
3. Cada ejercicio de sesión guarda una **referencia** al catálogo (`exercise_id`) y una **copia del nombre** de ese día. Renombrar no reescribe el historial.
4. La búsqueda ignora **mayúsculas y tildes** y busca el texto en **cualquier parte** del nombre.
5. Los valores por defecto **solo prellenan**; se pueden cambiar al registrar.
6. Los botones rápidos muestran los **más usados**.
7. Un nombre nuevo escrito al registrar crea el ejercicio **solo con el nombre**.
8. La pantalla de ejercicios permite **crear, editar, renombrar, archivar y fusionar**.
9. `/ejercicios` es una **sexta pestaña** de la navegación principal.
10. Al fusionar, el ejercicio destino **conserva sus valores por defecto**.
11. **No hay tipos de ejercicio.** Un mismo ejercicio (ej. Wall sit) se puede registrar isométrico o no con una casilla **Isométrico** en el modal de registro. La casilla decide qué campos pide cada serie.
12. En la sesión, los ejercicios se ven como **lista compacta** y el detalle se edita en un **modal**.
13. Se mantiene el enfoque mobile-first y la accesibilidad actual (controles etiquetados, uso a 320 px, teclado).

## Objetivo

Que los ejercicios existan como entidades definidas antes del registro, para:

1. Registrar más rápido: escribir unas letras, elegir y tener los campos ya llenos.
2. Evitar duplicados por escritura ("Wall sit", "wall-sit") que rompen los conteos de Insights.
3. Registrar correctamente ejercicios isométricos: cuántos segundos se mantuvo la posición en cada serie.
4. Mantener la sección de registro liviana aunque la sesión tenga muchos ejercicios.
5. Gestionar la lista de ejercicios sin tocar código ni migraciones.

## Experiencia

### Registro isométrico

Cada ejercicio de la sesión tiene una casilla **Isométrico** en el modal. Cambia los campos de las series:

| Casilla | Campos por serie | Resumen en la lista |
|---|---|---|
| Desmarcada | repeticiones, peso (kg) | `3 × 12 · 5 kg` |
| Marcada | segundos de mantención, peso (kg), repeticiones opcionales | `3 × 45 s` o `5 × 10 s` |

- Es el **mismo ejercicio del catálogo** en ambos casos: no existen "Wall sit" y "Wall sit isométrico". Insights y el historial lo cuentan como uno.
- La casilla viene marcada si el ejercicio tiene **"Isométrico por defecto"** en el catálogo (Wall sit en el catálogo inicial). Se puede cambiar en cada registro.
- Al desmarcarla se ocultan los segundos pero no se borran mientras el modal siga abierto, por si fue un error. Al guardar, una serie no isométrica no guarda segundos.
- La **nota por serie** queda detrás de un botón "Nota" en cada serie, cerrada por defecto.
- **Duración y distancia** del ejercicio completo (ej. Bicicleta 10 min) no se muestran siempre: aparecen con un enlace "+ Duración o distancia", o abiertas si ya tienen valor o valor por defecto.
- Catálogo inicial: **Wall sit** es isométrico por defecto; **Bicicleta** trae 10 min de duración por defecto.

### Registro de sesión (`/registrar`)

**Sección de ejercicios, vista compacta.**

```
EJERCICIOS (4)
┌──────────────────────────────────┐
│ Wall sit            3 × 45 s   › │
│ Step-up        3 × 12 · 5 kg   › │
│ Bicicleta              10 min  › │
│ ⚠ Puente de gluteos  Completar › │
└──────────────────────────────────┘
[ + Añadir ejercicio ]

Más usados:  [Step-up] [Wall sit] [Bicicleta] …
```

- Una fila por ejercicio con nombre y resumen de lo registrado. La lista no crece con las series.
- Una fila incompleta muestra un aviso ("Completar") y bloquea el guardado, como hoy.
- **Más usados:** hasta 8 ejercicios activos, ordenados por cuántas sesiones los incluyen, completados en orden alfabético.
  - Tocar un botón agrega el ejercicio con sus valores por defecto **sin abrir el modal**.
  - Si el ejercicio no tiene defaults, queda incompleto hasta abrirlo y completarlo.
  - Un ejercicio ya agregado se marca con ✓; tocarlo otra vez lo quita.
- Tocar una fila abre el **modal de detalle** de ese ejercicio.
- "+ Añadir ejercicio" abre el **mismo modal en modo búsqueda**.

**Modal de ejercicio.**

- En móvil sube desde abajo y ocupa casi toda la pantalla; en escritorio aparece centrado con ancho máximo.
- Se implementa con `<dialog>` nativo: foco atrapado, Escape y ✕ cierran, el foco vuelve a la fila o botón que lo abrió.
- Botones al pie: **Listo** (cierra y conserva los cambios) y **Quitar ejercicio**. Los cambios se aplican al borrador de la sesión mientras se escriben: cerrar no descarta nada. Nada se guarda en la base de datos hasta "Guardar sesión".

```
┌ Añadir ejercicio ─────────────── ✕ ┐
│ Nombre del ejercicio               │
│ [ glu|                           ] │
│   Puente de gluteos                │
│   Sentadilla + gluteo medio        │
│ ────────────────────────────────── │
│ Wall sit            [✓] Isométrico │
│ Serie 1   [ 45 ] s   [   ] kg   ⋯  │
│ Serie 2   [ 45 ] s   [   ] kg   ⋯  │
│ + Añadir serie                     │
│ + Duración o distancia             │
│ [ Quitar ]              [ Listo ]  │
└────────────────────────────────────┘
```

**Buscador con autocompletado** (dentro del modal):

- El campo es un combobox ARIA (`combobox` + `listbox`). Mientras se escribe, muestra hasta 8 ejercicios **activos** que coinciden, primero los que empiezan con el texto.
- Se elige con clic/tap o flechas + Enter.
- **Al elegir:** el nombre se fija, la casilla Isométrico toma el valor por defecto del ejercicio y se llenan los valores por defecto (N series con repeticiones o segundos y peso; duración y distancia). **Solo se llenan campos vacíos.**
- **Sin coincidencias:** la lista ofrece `Crear "<texto>"` y se registra normalmente, con la casilla Isométrico desmarcada.
- Si el texto coincide exactamente con un ejercicio existente, ignorando mayúsculas y tildes, **se vincula a él** y no se crea duplicado.
- Un ejercicio vinculado muestra el nombre fijo y un botón **Cambiar** para volver a buscar.
- No se puede agregar dos veces el mismo ejercicio del catálogo en una sesión.

**Al guardar la sesión.**

- Cada nombre nuevo crea un ejercicio en el catálogo solo con el nombre, sin valores por defecto.
- Los ejercicios nuevos y la sesión se guardan en **una sola transacción**: si algo falla no queda nada a medias, y el formulario conserva lo escrito (como hoy).
- Si un ejercicio vinculado fue archivado mientras se registraba, la sesión se guarda igual.

### Mantenimiento (`/ejercicios`)

- **Sexta pestaña "Ejercicios"** en la navegación principal. Debe caber a 320 px: iconos con etiquetas cortas, sin scroll horizontal.
- **Lista compacta** con el mismo estilo de filas:
  - cada fila muestra nombre, resumen de defaults y cantidad de sesiones
  - filtro por texto y pestañas **Activos / Archivados**
  - tocar una fila abre el modal de edición
- **Crear / Editar** (modal):
  - nombre: obligatorio, máximo 80 caracteres, único por usuario ignorando mayúsculas y tildes
  - casilla **Isométrico por defecto**
  - valores por defecto opcionales: series (1–20), repeticiones, segundos (1–3600, visibles si la casilla está marcada), peso en kg, duración en minutos y distancia en km
- Cambiar "Isométrico por defecto" solo afecta registros futuros.
- **Renombrar** no cambia el nombre guardado en sesiones anteriores.
- **Archivar / reactivar:** un archivado no aparece en el buscador ni en los más usados; su historial se conserva.
- **Fusionar** (desde el modal de edición):
  - se elige el ejercicio destino y se confirma viendo cuántas sesiones se reasignan
  - las sesiones del origen pasan al destino y el origen se elimina
  - el destino conserva su nombre y sus valores por defecto
- No hay borrado definitivo, salvo el del origen al fusionar.

### Historial, Insights y Reporte

- El historial muestra los segundos de las series isométricas (ej. `Serie 1 · 45 s`).
- Insights cuenta ejercicios por `exercise_id` cuando existe, para que ejercicios fusionados cuenten como uno.

## Modelo de datos

```sql
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  normalized_name text not null,
  default_isometric boolean not null default false,
  default_set_count integer check (default_set_count between 1 and 20),
  default_reps integer check (default_reps between 1 and 1000),
  default_hold_seconds integer check (default_hold_seconds between 1 and 3600),
  default_weight_kg numeric(7, 2) check (default_weight_kg between 0 and 1000),
  default_duration_minutes numeric(7, 2) check (default_duration_minutes > 0 and default_duration_minutes <= 1440),
  default_distance_km numeric(8, 3) check (default_distance_km > 0 and default_distance_km <= 1000),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, normalized_name),
  unique (id, user_id)
);

alter table public.session_exercises
  add column exercise_id uuid,
  add constraint session_exercises_exercise_fk
    foreign key (exercise_id, user_id) references public.exercises (id, user_id);

alter table public.session_exercises
  add column is_isometric boolean not null default false;

alter table public.session_exercise_sets
  add column hold_seconds integer check (hold_seconds is null or hold_seconds between 1 and 3600);
-- session_exercise_sets_content_check pasa a aceptar hold_seconds como contenido válido.
```

- **RLS:** select, insert, update y delete solo del propio `user_id`.
- **Nombres:**
  - `session_exercises.name` se mantiene como copia histórica.
  - `normalized_name` se calcula con una sola función compartida (`normalizeExerciseName`): minúsculas, sin tildes y espacios colapsados.
- **Catálogo inicial:** una función SQL idempotente `seed_default_exercises(user_id)`. Se llama en la migración para los usuarios existentes y, para los nuevos, la primera vez que abren `/registrar` o `/ejercicios` sin ejercicios.
- **Migración de datos:** vincular `session_exercises` existentes por `shortcut_id` o nombre normalizado; los que no coincidan crean su propio ejercicio. Hoy staging no tiene registros.
- **`shortcut_id`:** queda sin uso y se elimina en una migración posterior.
- **Escritura atómica:** una función Postgres (RPC, `security invoker`) crea los ejercicios nuevos, la sesión, los ejercicios de sesión y las series en una transacción.

## Tech Stack

- Next.js del repo (App Router, Server Actions). Leer `node_modules/next/dist/docs/` antes de escribir código, según `AGENTS.md`.
- Supabase Postgres con RLS y migraciones en `supabase/migrations/`.
- Zod para validar; Vitest para unitarios; Playwright para e2e.
- Sin dependencias nuevas: modal con `<dialog>` nativo y combobox con el patrón ARIA.

## Commands

Por la política del proyecto **no se ejecuta nada pesado en local**. El build y los e2e corren en CI; las migraciones se aplican al entorno remoto.

```
Tipos:         npm run typecheck
Unitarios:     npm test
Lint:          npm run lint
Migración:     npm run supabase:push:dry && npm run supabase:push:linked
E2E y deploy:  push a main → .github/workflows/ci-cd.yml
```

## Project Structure

```
supabase/migrations/2026MMDD_exercise_catalog.sql   → tablas, RLS, seed, backfill, RPC
src/types/recovery.ts                               → Exercise, isIsometric, holdSeconds, exerciseId
src/lib/exercise-name.ts (+ .test.ts)               → normalizeExerciseName, matchExercises
src/lib/exercise-summary.ts (+ .test.ts)            → "3 × 45 s", "3 × 12 · 5 kg", "10 min"
src/lib/exercise-entry-state.ts (+ .test.ts)        → vincular, defaults sin sobrescribir, casilla isométrico
src/lib/validation/recovery.ts (+ .test.ts)         → schemas de catálogo y payload
src/data/exercise-repository.ts                     → listar, más usados, crear, editar, archivar, fusionar
src/components/modal-sheet.tsx                      → <dialog> reutilizable (sheet en móvil)
src/components/exercise-name-combobox.tsx           → buscador con autocompletado
src/components/exercise-entry-editor.tsx            → lista compacta + más usados + modal
src/components/app-shell.tsx                        → sexta pestaña
src/app/ejercicios/page.tsx                         → pantalla de mantenimiento
src/features/exercises/                             → lista, formulario, fusión, server actions
src/features/history/                               → mostrar segundos
tests/e2e/exercise-catalog.spec.ts                  → catálogo, autocompletado, isométrico, modal
```

## Code Style

Mismos patrones del repo: funciones puras probadas con Vitest para el estado del editor y componentes cliente delgados. Textos de interfaz en español y código en inglés.

```ts
export function applyExerciseDefaults(
  entry: ExerciseEntryDraft,
  exercise: Exercise,
  nextSetId: () => string,
): ExerciseEntryDraft {
  return {
    ...entry,
    exerciseId: exercise.id,
    name: exercise.name,
    isIsometric: entry.sets.length > 0 ? entry.isIsometric : exercise.defaultIsometric,
    durationMinutes: entry.durationMinutes || formatDraft(exercise.defaultDurationMinutes),
    distanceKm: entry.distanceKm || formatDraft(exercise.defaultDistanceKm),
    sets: entry.sets.length > 0 ? entry.sets : buildDefaultSets(exercise, nextSetId),
  };
}
```

## Testing Strategy

- **Unitarios (Vitest):**
  - `normalizeExerciseName` (tildes, mayúsculas, espacios)
  - `matchExercises` (prefijo primero, excluye archivados, máximo 8)
  - `summarizeExercise` isométrico y no isométrico, duración y distancia
  - `applyExerciseDefaults` (no sobrescribe; crea N series con segundos o repeticiones)
  - completitud con la casilla (una serie isométrica con solo segundos es válida; al desmarcar, los segundos no cuentan ni se envían)
  - payload con ejercicios nuevos, vinculados y por coincidencia exacta
  - más usados con relleno alfabético
- **Repositorio:** la fusión reasigna sesiones y elimina el origen; un nombre duplicado se rechaza.
- **E2E (Playwright, solo en CI):**
  1. escribir "glu", elegir la coincidencia, ver las series autocompletadas y la fila compacta con su resumen
  2. registrar Wall sit con la casilla marcada y segundos, guardar y ver `45 s` en el historial; registrar el mismo ejercicio sin la casilla y comprobar que es un solo ejercicio en `/ejercicios`
  3. escribir un nombre nuevo, guardar y verlo en `/ejercicios`
  4. archivar un ejercicio y comprobar que no aparece en el buscador
  5. fusionar dos ejercicios y ver el historial intacto
  6. el modal se abre, cierra con Escape y devuelve el foco
- **Regresión:** Insights no cuenta un ejercicio por cada serie; el historial muestra el nombre copiado.

## Boundaries

- **Siempre:** conservar el historial; validar con Zod; RLS en tablas nuevas; typecheck, lint y unitarios antes de cada commit; dry-run antes de migrar.
- **Preguntar antes:** aplicar la migración en staging; agregar dependencias; eliminar `shortcut_id`.
- **Nunca:** correr Docker, build o e2e en la PC local; reescribir nombres históricos; borrar ejercicios con historial (solo archivar o fusionar).

## Success Criteria

1. Con 6 ejercicios en la sesión, la sección de ejercicios muestra 6 filas compactas y ningún campo de serie fuera del modal.
2. Al escribir "glu" aparece "Puente de gluteos" en menos de 200 ms, sin recargar.
3. Elegir un ejercicio con defaults `3 × 12 · 5 kg` crea 3 series editables con esos valores.
4. Con la casilla Isométrico marcada, cada serie pide segundos. `3 × 45 s` se guarda, se ve en la fila y aparece en el historial, y el mismo ejercicio se puede registrar sin la casilla otro día sin crear un duplicado.
5. Guardar con un nombre nuevo crea exactamente un ejercicio; escribir "wall sit" con "Wall sit" ya existente no crea duplicado.
6. Si falla el guardado, no quedan ni la sesión ni ejercicios nuevos, y el formulario conserva lo escrito.
7. Los botones rápidos muestran los 8 ejercicios activos más usados.
8. La pestaña Ejercicios permite crear, editar, renombrar, marcar isométrico por defecto, archivar, reactivar y fusionar, y el historial muestra los nombres originales.
9. La navegación con 6 pestañas funciona a 320 px sin scroll horizontal.
10. Lint, typecheck, unitarios y e2e en verde en CI.

## Open Questions

Ninguna por ahora.
