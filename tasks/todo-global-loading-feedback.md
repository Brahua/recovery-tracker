# Todo: Loading global y feedback de acciones

Plan: `tasks/plan-global-loading-feedback.md` · Spec: `docs/specs/global-loading-and-feedback-spec.md`

## Fase A — Infraestructura (PR 1)

- [x] A1. Store de operaciones en curso
  - Acceptance: `begin()` incrementa y su función de cierre decrementa una sola vez (idempotente); suscriptores notificados; nunca baja de 0.
  - Verify: `npx vitest run src/lib/pending-store.test.ts`
  - Files: `src/lib/pending-store.ts`, `src/lib/pending-store.test.ts`

- [x] A2. Lógica pura de feedback
  - Acceptance: `{ok:true}` → toast de éxito; `{ok:false,error}` → error inline (sin toast); `{error}` (formato sesión/cierre) → inline; excepción → toast "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."
  - Verify: `npx vitest run src/lib/action-feedback.test.ts`
  - Files: `src/lib/action-feedback.ts`, `src/lib/action-feedback.test.ts`

- [x] A3. Toasts + barra de progreso montados globalmente
  - Acceptance: `useToast().success/error` muestra toast (`role=status` / `role=alert`), autocierre ~3 s (error ~6 s), botón cerrar; `NavigationProgress` visible cuando el conteo > 0 por más de 120 ms; respeta `prefers-reduced-motion`; no tapa la barra móvil.
  - Verify: test jsdom de toast (`src/components/feedback/toast-provider.test.tsx`); typecheck; lint
  - Files: `src/components/feedback/toast-provider.tsx`, `src/components/feedback/feedback-providers.tsx`, `src/components/navigation-progress.tsx`, `src/app/layout.tsx`, `src/app/globals.css`

- [x] A4. Hook `useActionFeedback`
  - Acceptance: marca pending durante la action, aplica A2, llama `onSuccess`/`onError`, captura excepciones; expone `pending`.
  - Verify: test jsdom con action que resuelve, falla y lanza
  - Files: `src/components/feedback/use-action-feedback.ts`, `src/components/feedback/use-action-feedback.test.tsx`

## Fase B — Shell persistente (PR 2)

- [x] B1. Layout `(app)` y mover rutas
  - Acceptance: `git mv` de `page.tsx`, `registrar/`, `historial/`, `ejercicios/`, `insights/`, `reporte/` a `src/app/(app)/`; URLs iguales; `(app)/layout.tsx` carga user + racha y renderiza `AppShell`, o solo `children` sin usuario.
  - Verify: typecheck; lint; CI E2E
  - Files: `src/app/(app)/layout.tsx` + archivos movidos

- [x] B2. Páginas sin `AppShell` y shell con tab activo por `usePathname`
  - Acceptance: ninguna página importa `AppShell`; tab activo, `is-history` e immersive (`ImmersiveMarker` + `:has`) funcionan como antes.
  - Verify: typecheck; CI E2E (`mobile-layout`, `post-therapy-check-in`, `nightly-closeout`)
  - Files: `src/components/app-shell.tsx`, `src/components/shell-nav.tsx`, las 8 páginas, `src/app/globals.css`

- [x] B3. Racha fresca después de guardar
  - Acceptance: sesión, cierre y fusión llaman `revalidatePath("/", "layout")`; la racha del sidebar se actualiza sin recargar.
  - Verify: aserción E2E de racha tras guardar sesión
  - Files: `src/features/check-in/post-therapy/actions.ts`, `src/features/check-in/nightly-closeout/actions.ts`, `src/features/exercises/actions.ts`, `tests/e2e/post-therapy-check-in.spec.ts`

- [x] B4. Skeletons por ruta
  - Acceptance: `loading.tsx` en `(app)`, `registrar`, `historial`, `ejercicios`, `insights`, `reporte` con skeleton `rr-skeleton` (animación desactivada con reduced-motion); el shell queda visible.
  - Verify: E2E con red lenta simulada: click en tab → skeleton visible y sidebar presente
  - Files: `src/app/(app)/**/loading.tsx`, `src/components/page-skeleton.tsx`, `src/app/globals.css`, `tests/e2e/navigation-feedback.spec.ts`

## Fase C — Fuentes de pending (PR 3)

- [x] C1. `AppLink` y regla ESLint
  - Acceptance: `AppLink` reporta `useLinkStatus` al store; los 15 archivos usan `AppLink`; `no-restricted-imports` bloquea `next/link` fuera de `app-link.tsx`.
  - Verify: lint (la regla falla si se reintroduce); typecheck; E2E barra visible al click
  - Files: `src/components/app-link.tsx`, `eslint.config.mjs`, 15 archivos con links (mecánico)

- [x] C2. `useAppRouter`
  - Acceptance: `push`/`replace` corren en transición que reporta pending; usado en `routine-editor.tsx` y en el cambio de fecha del cierre.
  - Verify: typecheck; E2E cambio de fecha del cierre muestra barra
  - Files: `src/components/use-app-router.ts`, `src/features/routines/routine-editor.tsx`, `src/features/check-in/nightly-closeout/form.tsx`

- [x] C3. Pending de formularios `useActionState`
  - Acceptance: `FormPendingReporter` (`useFormStatus`) dentro de los formularios de sesión y cierre y del form de "Salir".
  - Verify: typecheck; E2E guardar sesión muestra barra
  - Files: `src/components/feedback/form-pending-reporter.tsx`, `post-therapy/form.tsx`, `nightly-closeout/form.tsx`, `src/components/app-shell.tsx`

## Fase D — Feedback por acción (PR 4)

- [x] D1. Ejercicios (acciones 3–5)
  - Acceptance: toasts "Ejercicio guardado" / "Ejercicio archivado" / "Ejercicio restaurado" / "Ejercicios fusionados"; validación sigue inline; excepción → toast de error y el sheet queda abierto.
  - Verify: `tests/e2e/exercise-catalog.spec.ts` verifica toasts
  - Files: `src/features/exercises/exercise-form.tsx`, `tests/e2e/exercise-catalog.spec.ts`

- [x] D2. Rutinas (acciones 6–8)
  - Acceptance: "Rutina guardada" / "Rutina eliminada" visibles tras volver a la lista; "Guardar sesión como rutina" usa toast en lugar del mensaje inline (se conserva el link a la rutina en el sheet cerrado si existe hoy).
  - Verify: `tests/e2e/routines.spec.ts` verifica toasts
  - Files: `src/features/routines/routine-editor.tsx`, `src/features/routines/save-session-as-routine.tsx`, `tests/e2e/routines.spec.ts`

- [x] D3. Sesión y cierre (acciones 1–2)
  - Acceptance: toast "Sesión guardada" / "Cierre guardado" una sola vez al llegar con `sessionSaved=1` / `nightlySaved=1` (no se repite al recargar); pantallas de guardado sin cambios; excepción de red → toast de error.
  - Verify: E2E `post-therapy-check-in` y `nightly-closeout` verifican toast
  - Files: `src/components/feedback/toast-on-mount.tsx`, `src/app/(app)/registrar/page.tsx`, `post-therapy/form.tsx`, `nightly-closeout/form.tsx`, E2E correspondientes

- [x] D4. Cerrar sesión (acción 9)
  - Acceptance: si `signOutAction` falla, toast de error y el usuario sigue en la app.
  - Verify: typecheck; revisión manual en staging
  - Files: `src/app/auth/actions.ts`, `src/components/app-shell.tsx`

- [ ] D5. Cierre
  - Acceptance: spec marcado como implementado; handoff en `docs/`; revisión manual en staging (desktop + móvil).
  - Files: `docs/specs/global-loading-and-feedback-spec.md`, `docs/session-handoff-*.md`

## Desvíos respecto del plan

- Un solo PR con un commit por fase (pedido explícito), no 4 PRs.
- Sin tests de componentes con jsdom: no hay Testing Library y agregarla es una
  dependencia nueva. La lógica quedó en módulos puros con tests
  (`pending-store`, `action-feedback`, `toast-queue`) y la UI se cubre con E2E.
- Un único `src/app/(app)/loading.tsx` genérico en lugar de uno por ruta: al
  estar en la raíz del grupo cubre todas las rutas hijas.
- `revalidatePath("/", "layout")` solo en sesión y cierre (la fusión de
  ejercicios no cambia la racha).
- Excepciones en formularios de sesión/cierre y en "Salir" caen en
  `src/app/(app)/error.tsx` (mensaje + reintentar, con el shell visible).
- El test "keeps the current screen visible while history data loads" (que
  evitaba un loading sin shell, `cb7d7d4`) ahora verifica shell + barra de
  progreso.
- "Reactivar" usa el texto "Ejercicio reactivado" (coincide con el botón).
