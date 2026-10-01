# Plan: PWA y recordatorios

Spec: `docs/specs/pwa-and-reminders-spec.md`.

## Fases (un PR cada una, en orden)

```
PR 1 — App instalable, pantalla offline y /ajustes con tu nombre   (sin dependencias nuevas, sin secretos)
  P1 íconos → P2 manifest + metadata iOS → P3 service worker + /offline → A1 /ajustes (perfil + guía de instalación) → P4 E2E + docs
PR 2 — Ajustes y suscripción                 (requiere claves VAPID del owner antes del deploy)
  R1 migración tablas + RLS → R2 lógica pura + validación → R3 repositorio + actions → R4 sección Recordatorios en /ajustes → R5 notificación de prueba (web-push) → R6 E2E + docs
PR 3 — Envío programado                      (requiere service_role + secreto + Vault antes del deploy)
  D1 decisión de qué toca (pura) → D2 endpoint /api/reminders/dispatch → D3 migración pg_cron + pg_net + función → D4 docs + verificación con el owner
```

Cada PR deja la app funcionando: el PR 1 ya permite instalarla y cambiar tu nombre; el PR 2 deja guardar ajustes y probar una notificación; el PR 3 activa los envíos automáticos.

## Decisiones técnicas

- **Service worker a mano** (`public/sw.js`): `install` precachea `/offline` e íconos; `fetch` solo intercepta navegaciones (`request.mode === "navigate"`) y responde `/offline` si la red falla. No cachea nada más. `push` muestra la notificación; `notificationclick` enfoca una ventana abierta o abre la URL.
- **Registro del service worker** en un componente cliente del layout raíz, para toda la app (también la landing, así `/offline` queda en caché antes del login).
- **Cabeceras** de `/sw.js` en `next.config.ts`: `Cache-Control: no-cache, no-store, must-revalidate` y `Content-Type: application/javascript`, según la guía de Next.
- **Íconos**: un SVG del repo (`src/design-system/brand/app-icon.svg`) renderizado a PNG con Playwright (ya instalado) mediante un script reproducible; los PNG se commitean.
- **Ajustes**: Server Actions con `useActionState` y Zod, como el resto de formularios.
- **Nombre**: `supabase.auth.updateUser({ data: { display_name } })` desde una Server Action y `revalidatePath("/", "layout")` (el shell y Hoy leen el usuario con `getUser()`, que ya trae el valor nuevo). Campo propio porque Google puede reescribir `full_name` al iniciar sesión.
- **Hora local**: `Intl.DateTimeFormat` con `America/Lima` (mismo enfoque que `src/lib/recovery-date.ts`).
- **Ventana de envío**: se envía si `hora_elegida <= ahora_local < hora_elegida + 2 h`, es el mismo día local, no hay envío registrado y la acción sigue pendiente.
- **Idempotencia**: `insert` en `reminder_deliveries` con `on conflict do nothing` **antes** de enviar; si el insert no crea fila, otro proceso ya lo envió.
- **Dispatch**: `pg_net.http_post` con `Authorization: Bearer <secreto de Vault>`; cron `*/5 * * * *`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| iOS no muestra notificaciones si la app no está instalada | Guía de instalación en `/ajustes`; el botón de activar solo aparece instalada |
| El service worker sirve una versión vieja | `sw.js` sin caché HTTP; versión en el nombre de la caché; `skipWaiting` + `clients.claim` |
| El cron local/CI llama a producción | La función no hace nada si faltan los secretos de Vault; CI no los tiene |
| Doble envío si dos cron se solapan | Fila única por `(user_id, kind, local_date)` insertada antes de enviar |
| `service_role` filtrado al cliente | `src/lib/supabase/admin.ts` con `import "server-only"`; solo lo importa el endpoint |
| No poder probar push en CI | Lógica pura + `web-push` detrás de una interfaz simulada; prueba manual del owner como checkpoint |

## Checkpoints

- **PR 1:** CI verde → deploy → el owner instala en el iPhone, cambia su nombre y prueba modo avión.
- **PR 2:** owner carga VAPID → CI verde → deploy → el owner activa notificaciones y recibe la prueba.
- **PR 3:** owner carga `service_role`, secreto y Vault → CI verde → deploy (aplica la migración) → recordatorio real recibido y no repetido.
