# Spec: Loading global y feedback de acciones

Estado: **implementado (2026-09-17)**, pendiente de revisión en staging — plan en `tasks/plan-global-loading-feedback.md`

## Objective

Que la app nunca parezca congelada y que toda escritura le diga al usuario si
funcionó o falló.

1. **Loading global**: al cambiar de tab (sidebar o barra móvil) o al ejecutar
   una acción, el usuario ve de inmediato una señal de que algo está pasando.
2. **Feedback de escritura**: cada acción que crea, modifica o borra datos
   muestra un mensaje de éxito o de error.

Usuario: la persona en recuperación, casi siempre en el celular.

### Diagnóstico (estado actual)

**Navegación.** Todas las rutas son dinámicas (leen la sesión de Supabase
desde cookies) y ninguna tiene `loading.tsx`. Según la guía de Next 16
(`docs/01-app/01-getting-started/04-linking-and-navigating.md`), en ese caso no
hay prefetch y la navegación espera la respuesta del servidor antes de cambiar
algo en pantalla: esa es la "pantalla congelada". Además, `AppShell` se
renderiza dentro de cada `page.tsx` (no en el layout), así que un `loading.tsx`
simple reemplazaría también el sidebar y la barra móvil.

**Acciones de escritura (inventario):**

| # | Acción | Dónde | Éxito hoy | Error hoy |
|---|---|---|---|---|
| 1 | Registrar sesión (`createPostTherapySessionAction`) | `/registrar` | ✅ `SessionSavedState` | ✅ `role=alert` |
| 2 | Cierre nocturno (`createNightlyCloseoutAction`) | `/registrar` | ✅ pantalla de guardado | ✅ `role=alert` |
| 3 | Crear/editar ejercicio (`saveExerciseAction`) | `/ejercicios` | ❌ solo cierra el sheet | ✅ dentro del sheet |
| 4 | Archivar/restaurar ejercicio (`setExerciseArchivedAction`) | `/ejercicios` | ❌ solo cierra el sheet | ✅ dentro del sheet |
| 5 | Fusionar ejercicios (`mergeExercisesAction`) | `/ejercicios` | ❌ solo cierra el sheet | ✅ dentro del sheet |
| 6 | Crear/editar rutina (`saveRoutineAction`) | `/ejercicios/rutinas/*` | ❌ redirige sin mensaje | ✅ `role=alert` |
| 7 | Eliminar rutina (`deleteRoutineAction`) | `/ejercicios/rutinas/[id]` | ❌ redirige sin mensaje | ✅ `role=alert` |
| 8 | Guardar sesión como rutina (`createRoutineFromSessionAction`) | `/registrar` | ✅ `role=status` | ✅ `role=alert` |
| 9 | Cerrar sesión (`signOutAction`) | shell | redirige a landing (suficiente) | ❌ sin manejo |
| 10 | Login Google (`signInWithGoogleAction`) | landing | redirige a Google | ✅ `/auth/auth-code-error` |

Brecha transversal: las acciones 3–8 corren en `startTransition(async …)`. Si
la llamada **lanza** (sin red, timeout, server action caído) no hay `try/catch`:
el error sube a un error boundary (solo existen en `/ejercicios` y
`/historial`) o se pierde, sin mensaje útil.

## Assumptions (corrígeme si alguna está mal)

1. **Sin dependencias nuevas**: toasts y barra de progreso se hacen a mano con
   el sistema de estilos actual (`globals.css`, prefijo `rr-`), no con
   `sonner`/`nprogress`.
2. El loading global es una **barra de progreso fina arriba de la pantalla**
   (estilo YouTube/GitHub) + **skeleton del contenido** por ruta; el sidebar y
   la barra móvil se quedan visibles.
3. El feedback de éxito es un **toast** breve (≈3 s, cierre manual posible) que
   sobrevive a la navegación (p. ej. "Rutina eliminada" después de volver a la
   lista). Los errores de validación siguen mostrándose junto al formulario,
   como hoy; los errores inesperados (red, excepción) van como toast de error.
4. Login con Google (10) no cambia. Sesión y cierre (1, 2) conservan su
   pantalla de guardado y suman el toast (ver Decisiones).
5. Textos en español, sin tildes faltantes nuevas (seguimos el tono actual).
6. Nada de cambios de base de datos.

## Tech Stack

Next.js 16.2 (App Router) · React 19.2 · Supabase SSR · Tailwind 4 + CSS propio
(`src/app/globals.css`) · Vitest 4 (jsdom) · Playwright 1.61.

## Commands

```
Unit:      npx vitest run
Typecheck: npx tsc --noEmit
Lint:      npx eslint
E2E:       solo en CI (no correr local — ver notas del proyecto)
```

## Project Structure (lo nuevo)

```
src/components/feedback/
  toast-provider.tsx      → contexto + región aria-live + render de toasts
  use-action-feedback.ts  → helper: corre una acción, captura excepciones,
                            dispara toast de éxito/error
src/components/navigation-progress.tsx → barra superior
src/components/app-link.tsx → wrapper de next/link que reporta pending
src/lib/pending-store.ts (+ .test.ts) → contador global de operaciones en curso
src/app/(app)/layout.tsx   → carga usuario + racha y renderiza AppShell
src/app/(app)/**/loading.tsx → skeleton del contenido (el shell queda fuera)
src/lib/action-feedback.ts (+ .test.ts) → lógica pura: mapear resultado/excepción
                            a mensaje
```

Enfoque técnico:
- **Shell persistente**: `src/app/(app)/layout.tsx` obtiene usuario y racha y
  renderiza `AppShell`; el tab activo sale de `usePathname`. Las URLs no
  cambian (los grupos no afectan la ruta).
- **Links**: `AppLink` envuelve `next/link` y reporta `useLinkStatus` al store
  global; una regla ESLint `no-restricted-imports` evita volver a importar
  `next/link` directo.
- **Navegación programática**: `useAppRouter` envuelve `push`/`replace` en una
  transición que reporta pending.
- **Formularios y actions**: `useActionFeedback` (actions 3–9) y un
  `FormPendingReporter` con `useFormStatus` (formularios 1–2) reportan pending
  y disparan toasts; las excepciones siempre terminan en toast de error.
- **Barra**: `NavigationProgress` lee el store; aparece tras ~120 ms para no
  parpadear en llamadas instantáneas.
- **Skeleton**: `loading.tsx` por ruta dentro de `(app)`.

## Code Style

Igual que el código actual: componentes cliente pequeños, clases `rr-*`, lógica
pura en `src/lib` con test al lado. Ejemplo del patrón objetivo:

```tsx
const runWithFeedback = useActionFeedback();

function remove() {
  runWithFeedback(() => deleteRoutineAction(routine.id), {
    success: "Rutina eliminada",
    onSuccess: () => router.push(routinesHref),
    onError: setError, // errores de validación siguen junto al formulario
  });
}
```

## Testing Strategy

- **Unit (Vitest)**: `action-feedback.ts` — resultado ok → mensaje de éxito;
  `{ok:false,error}` → error inline; excepción → mensaje genérico de red.
- **Componentes (Vitest + jsdom)**: toast aparece, se anuncia vía `aria-live`,
  se cierra solo y manualmente.
- **E2E (CI)**: extender `exercise-catalog.spec.ts` y `routines.spec.ts` para
  verificar el toast de éxito en crear/editar/archivar/fusionar ejercicio y
  crear/eliminar rutina; verificar que la barra de progreso/skeleton aparece al
  cambiar de tab (con red lenta simulada).

## Boundaries

- **Always**: unit tests + typecheck + lint antes de commit; rama + PR para CI;
  accesibilidad (`role=status` éxito, `role=alert` error, respeta
  `prefers-reduced-motion`).
- **Ask first**: agregar dependencias; cambiar el
  flujo de guardado de sesión/cierre que ya funciona.
- **Never**: correr build/E2E/Docker local; tocar la base de datos; quitar tests
  existentes.

## Success Criteria

1. Al tocar cualquier link interno o tab, en ≤100 ms aparece la barra de progreso superior, y
   el contenido pasa a skeleton sin que desaparezcan sidebar ni barra móvil.
2. Mientras cualquier llamada al servidor (navegación programática, server
   action o envío de formulario) está en curso, la barra superior está activa;
   en acciones de escritura, además, su botón queda deshabilitado
   con texto de progreso y la barra superior está activa.
3. Las acciones 1–8 muestran un toast de éxito con texto específico
   ("Sesión guardada", "Cierre guardado", "Ejercicio guardado", "Ejercicio
   archivado", "Ejercicio reactivado", "Ejercicios fusionados", "Rutina
   guardada", "Rutina eliminada").
4. Toda acción 1–9 que lanza una excepción muestra un mensaje de error visible
   (nunca pantalla en blanco ni silencio) y el usuario puede reintentar.
5. Los toasts se anuncian a lectores de pantalla y no tapan la barra móvil ni
   los botones fijos de acción.
6. Unit tests nuevos pasan; CI (unit + E2E) en verde.

## Decisiones (2026-09-17)

1. **`AppShell` se mueve a un layout de grupo `(app)`**: el shell nunca se
   re-monta al navegar; el `loading.tsx` solo cubre el contenido.
2. **Toasts flotantes para todo el feedback de éxito**, incluida "Guardar sesión
   como rutina" (reemplaza su mensaje inline). Registrar sesión y cierre
   nocturno **conservan** su pantalla de guardado (es parte del flujo, no solo
   un mensaje) y además disparan el toast. Errores de validación siguen junto
   al formulario; errores inesperados → toast de error.
3. **Alcance del loading: toda llamada al servidor**, no solo tabs:
   - cualquier `<Link>` interno (no solo sidebar/barra móvil),
   - navegación programática (`router.push`/`replace`, p. ej. cambiar la fecha
     del cierre, volver a la lista de rutinas),
   - server actions (botones de ejercicios/rutinas, cerrar sesión),
   - envíos de formulario (`useActionState` en sesión y cierre).
