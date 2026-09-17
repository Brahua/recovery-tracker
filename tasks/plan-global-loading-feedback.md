# Implementation Plan: Loading global y feedback de acciones

Spec: `docs/specs/global-loading-and-feedback-spec.md` (decisiones 2026-09-17)
Tareas: `tasks/todo-global-loading-feedback.md`

## Overview

Tres piezas:
1. Infraestructura cliente: store de "operaciones en curso", barra de progreso
   y toasts.
2. Shell persistente: `AppShell` pasa a un layout `(app)`, con `loading.tsx`
   por ruta.
3. Conectar cada fuente de llamadas al servidor (links, router, formularios,
   server actions) al store y a los toasts.

## Estado actual relevante

- `src/app/layout.tsx` solo pone fuentes y `<body>`; no hay providers.
- Cada página (`/`, `/registrar`, `/historial`, `/ejercicios`,
  `/ejercicios/rutinas/nueva`, `/ejercicios/rutinas/[id]`, `/insights`,
  `/reporte`) llama `loadRecoveryPageData()` (o `routine-page-data.ts`),
  redirige a `/` sin usuario y envuelve su contenido en
  `<AppShell pathname streak user immersive?>`.
- `AppShell` (`src/components/app-shell.tsx`) es de servidor; usa `pathname`
  para el tab activo y la clase `is-history`, e `immersive` (solo `/registrar`
  en pantallas de guardado) para ocultar navegación.
- `/` sin usuario muestra `SignedOutLanding` (sin shell).
- `next/link` se importa en 15 archivos; `router.push/replace` en
  `routine-editor.tsx` y `nightly-closeout/form.tsx`.
- Server actions con `startTransition` sin `try/catch`: `exercise-form.tsx`,
  `routine-editor.tsx`, `save-session-as-routine.tsx`.
- Formularios con `useActionState`: `post-therapy/form.tsx`,
  `nightly-closeout/form.tsx` (redirigen a `/registrar?...Saved=1`).

## Arquitectura

```
RootLayout
└─ FeedbackProviders (client)  ← store pending + ToastProvider + NavigationProgress
   └─ (app)/layout.tsx (server) ← user + streak; sin user → children tal cual
      └─ AppShell (server) + ShellNav (client, usePathname)
         └─ loading.tsx (skeleton) / page.tsx (solo contenido)
```

- **pending-store** (`src/lib/pending-store.ts`): `begin(): () => void`,
  `subscribe`, `getSnapshot` (conteo) → `useSyncExternalStore`. Puro y testeable.
- **Toasts**: la cola vive en el mismo proveedor, montado en el root layout, así
  que sobrevive a `router.push` (toast "Rutina eliminada" visible en la lista).
  Para éxitos que llegan por redirect del servidor (sesión/cierre), la página
  ya lee `sessionSaved=1` / `nightlySaved=1`: un `<ToastOnMount>` cliente
  dispara el toast una sola vez.
- **immersive / is-history**: sin props desde la página. `ShellNav` usa
  `usePathname` para `is-history`; `immersive` se resuelve con un marcador
  `<ImmersiveMarker />` que la página renderiza y CSS
  `.rr-app-shell:has(.rr-immersive-marker)`.

## Orden de implementación

1. **Fase A — Infra (sin cambios visibles)**: pending-store + action-feedback
   puros con tests → providers, toast, barra en el root layout.
2. **Fase B — Shell persistente**: layout `(app)`, mover páginas, quitar
   `AppShell` de cada página, `loading.tsx` por ruta.
   *Checkpoint*: CI verde (E2E existentes cubren todas las rutas).
3. **Fase C — Fuentes de pending**: `AppLink` + regla ESLint, `useAppRouter`,
   `FormPendingReporter`.
4. **Fase D — Feedback por acción**: ejercicios → rutinas → sesión/cierre →
   cerrar sesión.
   *Checkpoint*: E2E actualizados verifican toasts; CI verde.

A y B son independientes entre sí; C y D dependen de A. Todo va en **un PR por
fase** (4 PRs chicos) para que CI valide cada paso.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| La racha en el layout queda vieja tras guardar (los layouts no se re-renderizan al navegar) | Las actions de sesión/cierre/fusión llaman `revalidatePath("/", "layout")`; E2E verifica racha tras guardar |
| Doble lectura de datos (layout + página) en el mismo render | El layout solo lee user + racha. Ojo con la memoización de fetch de React y Supabase (nota del proyecto): nunca escribir después de leer en el mismo render |
| Mover `page.tsx` a `(app)/` rompe imports relativos (`routine-page-data.ts`, `error.tsx`) | Mover carpetas completas con `git mv`; typecheck |
| `/` sin usuario no debe mostrar shell | El layout devuelve `children` sin shell si no hay usuario; E2E de landing |
| Barra parpadea en llamadas rápidas | Retraso de ~120 ms antes de mostrarse; `prefers-reduced-motion` sin animación |
| `useLinkStatus` no reporta si el link ya estaba prefetcheado | Aceptable: en ese caso la navegación es instantánea (skeleton o página ya lista) |
| Toasts tapan barra móvil / botones fijos | Posicionados arriba del `--mobile-tabbar` usando las mismas variables que el fix `e9638b6`; E2E en `mobile-layout.spec.ts` |

## Verificación

- Por tarea: `npx vitest run`, `npx tsc --noEmit`, `npx eslint`.
- Por fase: PR → CI (unit + E2E contra build de producción).
- Final: revisión manual en staging (tabs, guardar sesión, cierre con cambio de
  fecha, CRUD de ejercicios y rutinas, salir) en desktop y móvil.
