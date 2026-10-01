# Todo: PWA y recordatorios

Spec: `docs/specs/pwa-and-reminders-spec.md` · Plan: `tasks/plan-pwa-reminders.md`

Verificación en la PC: `npm run lint && npm run design:check && npm run typecheck && npm test`. Build y E2E en CI.

## PR 1: app instalable, offline y /ajustes con tu nombre

- [ ] P1. Ícono de la app
  - Acceptance: `src/design-system/brand/app-icon.svg` (anillo dorado sobre fondo oscuro) y script `scripts/pwa/render-icons.mjs` que genera `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` y `src/app/apple-icon.png` (180); `src/app/favicon.ico` sigue igual o se regenera.
  - Verify: los PNG existen con el tamaño correcto (`sips -g pixelWidth`); revisión visual.
  - Files: `src/design-system/brand/app-icon.svg`, `scripts/pwa/render-icons.mjs`, `public/icons/*`, `src/app/apple-icon.png`

- [ ] P2. Manifest y metadata de iOS
  - Acceptance: `src/app/manifest.ts`; `metadata.appleWebApp` (capable, `black-translucent`, título) y `viewport.themeColor` en `src/app/layout.tsx`.
  - Verify: test unitario del manifest (campos e íconos); typecheck.
  - Files: `src/app/manifest.ts`, `src/app/manifest.test.ts`, `src/app/layout.tsx`

- [ ] P3. Service worker y pantalla sin conexión
  - Acceptance: `public/sw.js` (precache `/offline` + íconos; fallback de navegación; listeners de push y click listos para el PR 2); registro desde `src/components/pwa/service-worker-registrar.tsx`; `src/app/offline/page.tsx` estática y pública; cabeceras de `/sw.js` en `next.config.ts`; `proxy.ts` no procesa `sw.js` ni `manifest.webmanifest`.
  - Verify: tests de cabeceras; E2E en CI (P4).
  - Files: `public/sw.js`, `src/components/pwa/*`, `src/app/offline/page.tsx`, `src/app/layout.tsx`, `next.config.ts`, `proxy.ts`, `src/design-system/styles/surfaces/offline.css`

- [ ] A1. Pantalla `/ajustes`: perfil y guía de instalación
  - Acceptance: ruta `src/app/(app)/ajustes/page.tsx`; enlace desde el perfil del shell (escritorio y avatar en móvil); sección "Perfil" con el nombre (Server Action + Zod + `auth.updateUser` con `display_name`, `revalidatePath("/", "layout")`, toast de éxito); sección "Instalar en tu iPhone" visible si es iOS y no está instalada; `getUserDisplayName` prefiere `display_name`; estilos en `surfaces/settings.css` con tokens.
  - Verify: tests de validación y de `getUserDisplayName`; `design:check`; E2E en P4.
  - Files: `src/app/(app)/ajustes/page.tsx`, `src/features/settings/*`, `src/lib/user-display-name.ts`, `src/lib/validation/profile.ts`, `src/components/app-shell.tsx`, `src/design-system/styles/surfaces/settings.css`, `src/app/globals.css`

- [ ] P4. E2E y documentación del PR 1
  - Acceptance: `tests/e2e/pwa.spec.ts` (manifest válido, `sw.js` con cabeceras, `/offline` visible y sin violaciones de axe, el service worker queda activo); `tests/e2e/settings.spec.ts` (cambiar el nombre → Hoy saluda con el nuevo; vaciarlo vuelve al anterior); axe en `/ajustes`; `e2e:critical` los incluye; `CHANGELOG`, `HANDOFF`, backlog ("Editar el nombre" hecho).
  - Verify: CI verde → merge → deploy → el owner instala en el iPhone, cambia su nombre y prueba modo avión.
  - Files: `tests/e2e/pwa.spec.ts`, `package.json`, docs

## PR 2: ajustes y suscripción

- [ ] R1. Migración de tablas
  - Acceptance: `push_subscriptions`, `reminder_settings`, `reminder_deliveries` con RLS (dueño), índices y `updated_at`; aditiva.
  - Verify: CI aplica la migración en Supabase local; revisión del SQL; `npm run supabase:push:dry` (lectura) lista solo esta migración.
  - Files: `supabase/migrations/20261001000000_reminders.sql`, `src/types/database.generated.ts` (si aplica)

- [ ] R2. Tipos, validación y hora local
  - Acceptance: tipos `ReminderSettings`, `ReminderKind`; Zod para el formulario (`HH:MM`, booleanos); helpers de hora local Lima.
  - Verify: tests unitarios.
  - Files: `src/types/reminders.ts`, `src/lib/reminders/settings.ts`, `src/lib/reminders/*.test.ts`

- [ ] R3. Repositorio y Server Actions
  - Acceptance: leer/guardar ajustes (con valores por defecto si no hay fila); guardar/borrar suscripción del dispositivo; acciones con `useActionState` y revalidación.
  - Verify: tests de mapeo; typecheck.
  - Files: `src/data/reminders-repository.ts`, `src/features/reminders/actions.ts`

- [ ] R4. Sección Recordatorios en `/ajustes`
  - Acceptance: activar este dispositivo, dos interruptores con hora, estados (no soportado, falta instalar, permiso denegado, activo); estilos en `surfaces/settings.css` con tokens.
  - Verify: `design:check`; E2E en CI (R6).
  - Files: `src/app/(app)/ajustes/page.tsx`, `src/features/reminders/*`, `src/design-system/styles/surfaces/settings.css`

- [ ] R5. Notificación de prueba
  - Acceptance: `web-push` + tipos; `src/lib/push/send.ts` (server-only) con VAPID desde env; acción "Enviar prueba" a las suscripciones del usuario; borra suscripciones 404/410.
  - Verify: tests con `web-push` simulado.
  - Files: `package.json`, `src/lib/push/*`, `src/features/reminders/actions.ts`

- [ ] R6. E2E y documentación del PR 2
  - Acceptance: `tests/e2e/settings.spec.ts` (guardar y recuperar horas e interruptores); docs con los pasos del owner (VAPID) y variables nuevas en `docs/deployment.md` y `.env.example`.
  - Verify: owner carga VAPID → CI verde → merge → deploy → el owner activa y recibe la prueba en el iPhone.
  - Files: `tests/e2e/settings.spec.ts`, `tests/e2e/accessibility.spec.ts`, docs

## PR 3: envío programado

- [ ] D1. Qué recordatorio toca
  - Acceptance: `dueReminders()` pura (ventana de 2 h, una vez por día, condición pendiente, Lima, día local); contenido y URL de cada tipo.
  - Verify: tests unitarios con casos de borde (justo a la hora, +2 h, medianoche, ya enviado, ya hecho, apagado).
  - Files: `src/lib/reminders/due-reminders.ts`, `src/lib/reminders/due-reminders.test.ts`, `src/lib/reminders/messages.ts`

- [ ] D2. Endpoint `/api/reminders/dispatch`
  - Acceptance: `POST` con secreto en tiempo constante; cliente `service_role` server-only; lee ajustes, suscripciones, sesiones/cierres de hoy y envíos; reserva el envío y luego manda; limpia 404/410; responde solo contadores.
  - Verify: tests del handler con dependencias simuladas (401, 405, envío, idempotencia, limpieza).
  - Files: `src/app/api/reminders/dispatch/route.ts`, `src/app/api/reminders/dispatch/route.test.ts`, `src/lib/supabase/admin.ts`, `src/data/reminders-repository.ts`

- [ ] D3. Migración del cron
  - Acceptance: `pg_cron` + `pg_net`; `public.dispatch_reminders()` (`security definer`, lee Vault, no hace nada si faltan secretos); job `dispatch-reminders` `*/5 * * * *`; idempotente.
  - Verify: CI aplica la migración en Supabase local sin llamar a nada.
  - Files: `supabase/migrations/20261001010000_reminders_dispatch.sql`

- [ ] D4. Documentación y verificación final
  - Acceptance: `docs/deployment.md` (secretos, SQL de Vault, cómo ver el historial del cron), `HANDOFF`, `RECAP`, backlog (PWA y recordatorios hechos), `CHANGELOG`; spec implementada.
  - Verify: owner carga `service_role`, secreto y Vault → CI verde → merge → deploy → recordatorio real recibido una sola vez en el iPhone.
  - Files: docs
