# Spec: Rutinas

## Estado

Aprobada el 2026-09-17. Implementada en la rama `feature/routines` (PR a `main`), pendiente de revisión. Migración: `20260918000000_routines.sql`.

## Decisiones validadas

1. Se llaman **Rutinas** en toda la app.
2. Se gestionan **dentro de la pestaña Ejercicios**, con dos secciones: `Ejercicios | Rutinas`. No hay una séptima pestaña.
3. **Usar rutina** al registrar **agrega** sus ejercicios a los que ya tenga la sesión y omite los que ya están. Se puede usar más de una rutina en la misma sesión.
4. Extra de esta versión: **Guardar sesión como rutina** desde la pantalla de sesión guardada.

## Suposiciones

1. Las rutinas son **por usuario**, con RLS, igual que el catálogo.
2. Cada ejercicio de una rutina **apunta a un ejercicio del catálogo**. Un nombre nuevo escrito en la rutina crea el ejercicio en el catálogo al guardar, igual que al registrar.
3. Cada ejercicio de la rutina guarda **su propio plan**: casilla Isométrico, series (repeticiones o segundos, peso), duración y distancia. El plan de la rutina tiene prioridad sobre los valores por defecto del catálogo.
4. Usar una rutina **solo prellena**. Lo que cambies al registrar no modifica la rutina.
5. La rutina muestra el **nombre actual** del ejercicio del catálogo (es una plantilla, no un registro histórico). Si fusionas ejercicios, las rutinas pasan a usar el ejercicio destino.
6. Se reutilizan la lista compacta, el modal del ejercicio y el buscador del registro. No hay un editor nuevo de ejercicios.
7. Mobile-first y accesibilidad como en el resto de la app.

## Objetivo

Registrar en segundos las sesiones que se repiten (por ejemplo, la rutina de fisioterapia de cada semana): elegir una rutina, ajustar lo que cambió ese día y guardar.

## Experiencia

### Pestaña Ejercicios → sección Rutinas

```
Ejercicios
[ Ejercicios | Rutinas ]

┌──────────────────────────────────┐
│ Core rodilla      5 ejercicios › │
│ Gimnasio A        7 ejercicios › │
└──────────────────────────────────┘
[ + Nueva rutina ]
```

- El selector `Ejercicios | Rutinas` cambia la sección sin salir de la pestaña. La URL recuerda la sección (`/ejercicios?seccion=rutinas`).
- Cada fila muestra el nombre, la cantidad de ejercicios y, debajo, los primeros nombres (ej. `Wall sit · Step-up · Bicicleta…`).
- Sin rutinas: estado vacío con "Crea tu primera rutina" y la sugerencia de guardarla desde una sesión registrada.
- Tocar una fila abre la **página de la rutina**.

### Página de rutina (`/ejercicios/rutinas/nueva` y `/ejercicios/rutinas/[id]`)

Es una página y no un modal, porque el editor de ejercicios ya abre su propio modal y no conviene apilar modales en móvil.

```
‹ Rutinas
Nombre de la rutina
[ Core rodilla                  ]

EJERCICIOS (3)
┌──────────────────────────────────┐
│ Wall sit            3 × 45 s   › │
│ Step-up        3 × 12 · 5 kg   › │
│ Bicicleta              10 min  › │
└──────────────────────────────────┘
[ + Añadir ejercicio ]

[ Eliminar ]              [ Guardar ]
```

- **Nombre:** obligatorio, máximo 60 caracteres, único por usuario ignorando mayúsculas y tildes.
- **Ejercicios:** entre 1 y 20, con el mismo editor del registro (lista compacta, modal, buscador, casilla Isométrico, series, duración y distancia, más usados).
- **Plan parcial permitido:** en una rutina, un ejercicio puede no tener series; se completará al registrar. La fila muestra "Sin plan".
- **Repetidos:** no se puede repetir un ejercicio dentro de la rutina (mismo aviso "Repetido" que al registrar).
- **Eliminar:** borra la rutina tras confirmar. Las sesiones ya registradas no cambian.
- Al guardar se vuelve a la sección Rutinas.

### Registrar sesión (`/registrar`)

En la sección de ejercicios aparece **Usar rutina** junto a "+ Añadir ejercicio":

```
EJERCICIOS (0)
[ Usar rutina ]  [ + Añadir ejercicio ]
```

- Abre un modal con las rutinas: nombre, cantidad y primeros ejercicios.
- Elegir una **agrega** sus ejercicios al final, con el plan de la rutina:
  - si el ejercicio **ya está** en la sesión, se omite y no se tocan sus datos
  - si la rutina no tiene plan para un ejercicio, se usan los valores por defecto del catálogo
- Tras agregar, un mensaje breve confirma: `Se agregaron 4 ejercicios de "Core rodilla" · 1 ya estaba`.
- Sin rutinas: el modal muestra un enlace a crear una en `Ejercicios → Rutinas`.

### Guardar sesión como rutina

- En la pantalla **Sesión hecha** aparece el botón **Guardar como rutina**.
- Pide un nombre (sugerido: tipo de sesión + fecha, ej. `Fisio guiada 17 sep`) y crea la rutina con los ejercicios y series de esa sesión.
- Si el nombre ya existe, muestra el error sin cerrar el formulario.
- Al terminar ofrece "Ver rutina".

## Modelo de datos

```sql
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  normalized_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, normalized_name),
  unique (id, user_id)
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  user_id uuid not null,
  exercise_id uuid not null,
  position integer not null check (position between 0 and 19),
  is_isometric boolean not null default false,
  duration_minutes numeric(7, 2),
  distance_km numeric(8, 3),
  unique (id, user_id),
  unique (routine_id, exercise_id),
  unique (routine_id, position),
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade,
  foreign key (exercise_id, user_id) references public.exercises (id, user_id)
);

create table public.routine_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null,
  user_id uuid not null,
  position integer not null check (position between 0 and 99),
  reps integer, weight_kg numeric(7, 2), hold_seconds integer,
  unique (routine_exercise_id, position),
  foreign key (routine_exercise_id, user_id) references public.routine_exercises (id, user_id) on delete cascade
);
```

- **RLS:** select, insert, update y delete solo del propio `user_id` en las tres tablas. Mismos rangos que en las sesiones (`reps` 1–1000, `weight_kg` 0–1000, `hold_seconds` 1–3600).
- **Nombre:** `normalized_name` se llena con un trigger usando `normalize_exercise_name`.
- **`save_routine(routine_id uuid, payload jsonb)`** (RPC, `security invoker`): crea o reemplaza la rutina completa en una transacción. Resuelve cada ejercicio igual que `create_rehab_session` (id → nombre normalizado, reactivando archivados → crear) y rechaza repetidos.
- **`create_routine_from_session(session_id uuid, name text)`** (RPC): copia los ejercicios vinculados y sus series (sin notas) a una rutina nueva.
- **`merge_exercises`** se amplía en una migración nueva: además de las sesiones, pasa las filas de `routine_exercises` al destino; si la rutina ya tenía el destino, se elimina la fila del origen.
- **Sesiones:** en esta versión no guardan qué rutina se usó (ver preguntas abiertas).

## Tech Stack

- Next.js 16 del repo (App Router, Server Actions); leer `node_modules/next/dist/docs/` antes de usar rutas dinámicas y `searchParams`.
- Supabase Postgres con RLS; migración nueva en `supabase/migrations/`.
- Zod, Vitest y Playwright. Sin dependencias nuevas.

## Commands

No se ejecuta nada pesado en local: el build y los e2e corren en CI, en un PR a `main`.

```
Tipos:         npm run typecheck
Unitarios:     npm test
Lint:          npm run lint
Migración:     npm run supabase:push:dry && npm run supabase:push:linked   (tras CI verde)
E2E y deploy:  PR a main → CI; merge a main → deploy a staging
```

## Project Structure

```
supabase/migrations/2026MMDD_routines.sql         → tablas, RLS, save_routine, create_routine_from_session, merge ampliado
src/types/recovery.ts                             → Routine, RoutineExercise
src/lib/routine-state.ts (+ .test.ts)             → rutina ↔ borradores del editor, agregar a sesión omitiendo repetidos
src/lib/validation/routines.ts (+ .test.ts)       → schemas de rutina
src/data/routine-repository.ts                    → listar, obtener, guardar, eliminar, crear desde sesión
src/features/routines/                            → lista, página de rutina, acciones, selector "Usar rutina", guardar como rutina
src/features/exercises/exercise-catalog.tsx       → selector Ejercicios | Rutinas
src/app/ejercicios/rutinas/nueva/page.tsx         → nueva rutina
src/app/ejercicios/rutinas/[id]/page.tsx          → editar rutina
src/components/exercise-entry-editor.tsx          → acción "Usar rutina" y modo rutina (plan parcial permitido)
src/components/session-saved-state.tsx            → botón "Guardar como rutina"
tests/e2e/routines.spec.ts                        → crear, usar, omitir repetidos, guardar desde sesión, fusión
```

## Code Style

Mismos patrones que el catálogo: funciones puras probadas con Vitest para transformar datos y componentes cliente delgados.

```ts
export function addRoutineToSession(
  entries: ExerciseEntryDraft[],
  routine: Routine,
  catalog: Exercise[],
  nextId: (prefix: string) => string,
): { entries: ExerciseEntryDraft[]; added: number; skipped: number } {
  const used = new Set(entries.flatMap((entry) => resolveEntryExerciseId(entry, catalog) ?? []));
  const additions = routine.exercises
    .filter((item) => !used.has(item.exerciseId))
    .map((item) => routineExerciseToEntry(item, catalog, nextId));

  return {
    entries: [...entries, ...additions],
    added: additions.length,
    skipped: routine.exercises.length - additions.length,
  };
}
```

## Testing Strategy

- **Unitarios (Vitest):**
  - `addRoutineToSession`: agrega al final, omite repetidos, cuenta agregados y omitidos, usa el plan de la rutina y recurre a los valores por defecto del catálogo si no hay plan
  - conversión de rutina a borradores y de vuelta (series isométricas, duración, distancia)
  - schema de rutina: nombre obligatorio y único, 1–20 ejercicios, sin repetidos, plan parcial permitido
  - validación del nombre sugerido para "Guardar como rutina"
- **E2E (Playwright, solo en CI):**
  1. crear una rutina con 2 ejercicios (uno isométrico) y verla en la sección Rutinas
  2. registrar: con un ejercicio ya agregado, usar la rutina, ver el mensaje "· 1 ya estaba" y guardar
  3. guardar una sesión como rutina y ver sus ejercicios y series en la página de la rutina
  4. fusionar dos ejercicios del catálogo y ver la rutina con el ejercicio destino
  5. eliminar una rutina y comprobar que las sesiones registradas siguen en el historial

## Boundaries

- **Siempre:** RLS en las tablas nuevas; validar con Zod; typecheck, lint y unitarios antes de cada commit; PR con CI en verde antes de aplicar la migración en staging.
- **Preguntar antes:** aplicar la migración en staging; hacer merge a `main`; agregar dependencias.
- **Nunca:** correr Docker, build o e2e en la PC local; modificar migraciones ya aplicadas (incluida la del catálogo); cambiar sesiones ya registradas al editar o eliminar una rutina.

## Success Criteria

1. Desde `Ejercicios → Rutinas` se crea una rutina con nombre y hasta 20 ejercicios con su plan, usando el mismo editor que al registrar.
2. En Registrar, "Usar rutina" agrega sus ejercicios con el plan en un toque; si un ejercicio ya estaba, se omite y el mensaje lo indica.
3. Se pueden usar dos rutinas en la misma sesión sin duplicar ejercicios.
4. Cambiar valores al registrar no modifica la rutina.
5. "Guardar como rutina" crea una rutina con los ejercicios y series de la sesión guardada.
6. Editar o eliminar una rutina no cambia sesiones registradas.
7. Fusionar ejercicios actualiza las rutinas sin dejar ejercicios repetidos.
8. Lint, typecheck, unitarios y e2e en verde en CI.

## Decisiones sobre preguntas abiertas

1. Las sesiones **no guardan** qué rutina se usó en esta versión.
2. Las rutinas se **eliminan** con confirmación; no se archivan.
3. Las rutinas **no guardan notas** (ni por serie ni por ejercicio).
