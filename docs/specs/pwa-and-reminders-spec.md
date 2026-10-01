# Spec: app instalable (PWA) y recordatorios

Estado: **aprobada (2026-10-01)** con horas por defecto Sesión 18:00 (apagado) y Cierre 21:30 (encendido), e ícono de anillo dorado. PRs 1–3 implementados (instalable y offline; ajustes y suscripción; envío programado). Falta la verificación del owner en el iPhone. Backlog: "PWA instalable" y "Recordatorios / notificaciones" (prioridad alta).

## Objetivo

Recovery Ritual se usa a diario desde un **iPhone**. Hoy se abre como página web y no avisa de nada, así que es fácil olvidar la sesión o el cierre del día.

Queremos:

1. **Instalarla en la pantalla de inicio** del iPhone: ícono propio, pantalla completa, sin barra del navegador.
2. **Recordatorios** que llegan como notificación del sistema:
   - **Sesión del día:** a la hora elegida, solo si hoy no hay ninguna sesión registrada.
   - **Cierre nocturno:** a la hora elegida, solo si el cierre de hoy no está hecho.
   - Cada uno se activa por separado y con hora configurable desde la app.
3. **Sin conexión:** en vez del error del navegador, una pantalla clara de "sin conexión". Registrar sigue necesitando internet.
4. **Tu nombre:** elegir desde `/ajustes` cómo te llama la app ("Hola, …" en Hoy y el nombre de la barra lateral). Hoy solo se puede cambiar por SQL.

**Usuario:** el owner (una cuenta real con Google), en iPhone. La solución funciona también en Android y escritorio, pero solo se prueba a fondo en iPhone.

### Criterios de aceptación

**Instalación**
1. `app/manifest.ts` con nombre, colores del tema oscuro, `display: "standalone"`, `start_url: "/"` e íconos 192, 512 y 512 *maskable*; `apple-touch-icon` de 180 para iOS.
2. En iPhone, "Compartir → Agregar a inicio" crea un ícono propio que abre la app a pantalla completa con la barra de estado oscura.
3. En `/ajustes`, si es un iPhone y la app no está instalada, una guía corta explica cómo agregarla al inicio (las notificaciones en iOS solo funcionan instalada, iOS 16.4+).

**Recordatorios**
4. `/ajustes` → "Recordatorios":
   - Botón "Activar notificaciones en este dispositivo": pide permiso, se suscribe a push y guarda la suscripción.
   - Dos interruptores con hora: **Sesión** (por defecto 18:00, apagado) y **Cierre del día** (por defecto 21:30, encendido).
   - "Enviar notificación de prueba".
   - Estados claros: no soportado, falta instalar (iOS), permiso denegado, activo en este dispositivo.
5. Un recordatorio llega **como mucho 5 minutos después** de la hora elegida, **una sola vez por día y tipo**, y **solo si sigue pendiente** (sin sesión hoy / sin cierre hoy). Si el envío se atrasa más de 2 horas (caída del servicio), no se manda.
6. "Hoy" se calcula en `America/Lima`, como el resto de la app.
7. Tocar la notificación abre la app en la pantalla correcta: `/registrar?mode=session` o `/registrar?mode=closeout`.
8. Si el navegador invalida una suscripción (la app se borró, permiso revocado), se elimina sola en el siguiente envío.

**Perfil (nombre)**
9. `/ajustes` → "Perfil": campo "¿Cómo quieres que te llamemos?" con el nombre actual; guardar actualiza al momento el saludo de Hoy ("Hola, …") y el nombre de la barra lateral.
10. Se guarda en `user_metadata.display_name` con `supabase.auth.updateUser` (sin migración). Es un campo propio porque Google puede reescribir `full_name` en cada inicio de sesión. Se usa tal como se escribe (sin cortar a la primera palabra).
11. Validación en el servidor: se recortan espacios, entre 1 y 30 caracteres, sin saltos de línea ni caracteres de control. Si se deja vacío, se borra y se vuelve al nombre de Google (primera palabra de `full_name`) o al del correo.
12. `getUserDisplayName` prefiere `display_name`, después `full_name` y después el correo.

**Sin conexión**
13. Un service worker guarda la pantalla `/offline` y la muestra cuando una navegación falla por falta de red. No guarda datos del usuario ni páginas autenticadas en caché.

**Seguridad y privacidad**
14. Las suscripciones y los ajustes tienen RLS: cada usuario solo ve y cambia lo suyo.
15. El endpoint que envía recordatorios exige un secreto (`Authorization: Bearer …`, comparación en tiempo constante), solo acepta `POST` y no devuelve datos de usuarios.
16. Los secretos (clave privada VAPID, `service_role` de Supabase, secreto del endpoint) solo viven en Vercel (Production, *sensitive*) y en Supabase Vault. **Nunca pasan por la sesión del agente ni por el repo**: el owner los crea en su terminal o en los paneles.

### Fuera de alcance

- Registrar sesiones o cierres sin conexión (cola local y sincronización): feature aparte.
- Notificaciones de otro tipo (racha, resumen semanal, citas).
- Botón propio de "Instalar" (`beforeinstallprompt` no existe en iOS; la guía de Next lo desaconseja).
- Pasar Vercel a Pro.

## Arquitectura

```
iPhone (PWA instalada)
  ├─ /ajustes ──(Server Actions)──► Supabase: push_subscriptions, reminder_settings (RLS)
  └─ service worker /sw.js: push → notificación · click → abre la ruta · navegación sin red → /offline

Supabase (producción)
  pg_cron cada 5 min ──► public.dispatch_reminders()
                          lee de Vault: URL del endpoint + secreto (si faltan, no hace nada)
                          └─ pg_net POST ──► https://recovery-tracker.brahua.com/api/reminders/dispatch

Next (Vercel) POST /api/reminders/dispatch
  1. valida el secreto
  2. con service_role: lee ajustes, suscripciones, sesiones/cierres de hoy y envíos de hoy
  3. decide qué toca (función pura, con tests)
  4. envía con web-push (VAPID) · registra el envío · borra suscripciones 404/410
```

**Por qué así:** el plan Hobby de Vercel solo permite cron diarios con ±59 min de imprecisión. `pg_cron` de Supabase es gratis, corre al minuto y ya tenemos Supabase. La lógica queda en TypeScript, con tests, y no en SQL. Supabase solo "toca el timbre".

**Local y CI:** la migración crea el job de `pg_cron`, pero sin los secretos en Vault la función no hace nada. Así el Supabase local de los E2E nunca llama a producción.

## Datos (migración nueva, aditiva)

| Tabla | Columnas clave | RLS |
|---|---|---|
| `push_subscriptions` | `id`, `user_id`, `endpoint` (único), `p256dh`, `auth`, `user_agent`, `created_at`, `last_success_at` | Dueño: select/insert/delete |
| `reminder_settings` | `user_id` (PK), `session_enabled`, `session_time` (`time`), `closeout_enabled`, `closeout_time`, `timezone` (por defecto `America/Lima`), `updated_at` | Dueño: select/insert/update |
| `reminder_deliveries` | `user_id`, `kind` (`session`/`closeout`), `local_date`, `sent_at`; único `(user_id, kind, local_date)` | Dueño: select; escribe solo `service_role` |

Además: extensiones `pg_cron` y `pg_net`, función `public.dispatch_reminders()` (`security definer`, lee Vault y hace el `POST`) y el job `dispatch-reminders` cada 5 minutos.

## Tech stack y dependencias nuevas

- Next 16.2 (App Router): `app/manifest.ts`, metadata `appleWebApp`, `viewport.themeColor`, Route Handler `app/api/reminders/dispatch/route.ts`, Server Actions para `/ajustes`.
- **`web-push`** (+ `@types/web-push`): envío con VAPID desde Node. **Dependencia nueva.**
- Supabase: `pg_cron`, `pg_net`, Vault. Cliente `service_role` solo en el endpoint (`src/lib/supabase/admin.ts`, `import "server-only"`).
- Service worker escrito a mano en `public/sw.js` (sin Serwist: requiere webpack y no hace falta para una pantalla offline).

### Variables y secretos nuevos

| Nombre | Dónde | Tipo |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel (todas) | config (pública) |
| `VAPID_PRIVATE_KEY` | Vercel Production | sensitive |
| `VAPID_SUBJECT` | Vercel Production | `mailto:` del owner |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Production | sensitive |
| `REMINDERS_DISPATCH_SECRET` | Vercel Production + Supabase Vault (`reminders_dispatch_secret`) | sensitive |
| `reminders_dispatch_url` | Supabase Vault | `https://recovery-tracker.brahua.com/api/reminders/dispatch` |

## Estructura

```
src/app/manifest.ts                         manifest
src/app/apple-icon.png, src/app/icon.png, public/icons/*   íconos (generados desde src/design-system/brand/app-icon.svg con scripts/pwa/render-icons.mjs)
public/offline.html                         pantalla sin conexión (autocontenida, la guarda el service worker)
src/app/(app)/ajustes/page.tsx              ajustes: perfil (nombre) + instalación + recordatorios
src/features/settings/                      UI y acción del nombre
src/app/api/reminders/dispatch/route.ts     endpoint del cron
src/features/reminders/                     UI de ajustes (cliente: permiso, suscripción, formulario)
src/lib/reminders/                          lógica pura con tests: qué recordatorio toca, hora local, payloads
src/lib/supabase/admin.ts                   cliente service_role (server-only)
src/data/reminders-repository.ts            lecturas/escrituras de ajustes y suscripciones
public/sw.js                                service worker
supabase/migrations/2026100100000_reminders.sql
src/design-system/styles/surfaces/settings.css
```

Acceso a `/ajustes`: desde el área de perfil del shell (barra lateral en escritorio y avatar en móvil). No se agrega una séptima pestaña.

## Estilo de código

Igual que el resto: Server Component pide datos → lógica pura en `src/lib` con tests → componente. Validación con Zod en el servidor. CSS con tokens (`design:check`). Textos en español, código en inglés.

```ts
// src/lib/reminders/due-reminders.ts (pura, con tests)
export function dueReminders(input: {
  now: Date;
  settings: ReminderSettings;
  hasSessionToday: boolean;
  hasCloseoutToday: boolean;
  deliveredToday: ReminderKind[];
}): ReminderKind[] { … }
```

## Comandos

```bash
npm run lint && npm run design:check && npm run typecheck && npm test   # en la PC
npx web-push generate-vapid-keys                                        # el owner, en su terminal
```

`next build`, E2E y Supabase local corren en CI (límites de la PC en `AGENTS.md`).

## Estrategia de pruebas

| Nivel | Qué | Dónde |
|---|---|---|
| Unitario | Qué recordatorio toca (hora, ventana de 2 h, una vez por día, condición pendiente, zona Lima, cambio de día); validación de ajustes; payload y URL de cada notificación; comparación del secreto | `src/lib/reminders/*.test.ts` |
| Unitario | Nombre: validación (recorte, largo, vacío = borrar) y prioridad `display_name` → `full_name` → correo | `src/lib/user-display-name.test.ts`, `src/lib/validation/*` |
| Unitario | Endpoint: rechaza sin secreto o con secreto incorrecto; con dependencias simuladas, envía, registra y limpia 404/410 | `src/app/api/reminders/dispatch/route.test.ts` |
| E2E (CI, Supabase local) | `/ajustes` cambia el nombre y Hoy saluda con el nuevo; guarda y recupera horas e interruptores; manifest y `sw.js` se sirven; `/offline` se ve y pasa axe | `tests/e2e/settings.spec.ts` |
| Base de datos (CI) | La migración aplica en el Supabase local; RLS impide leer ajustes ajenos | E2E + revisión de la migración |
| Manual (owner, iPhone) | Instalar, activar, prueba, recibir los dos recordatorios reales, tocar y llegar a la pantalla correcta, modo avión → pantalla offline | Lista en el PR |

El envío real de push no se puede probar en CI (necesita un navegador suscrito a Apple/Google). Por eso la decisión vive en una función pura, y el envío queda detrás de una interfaz simulable.

## Límites

- **Siempre:** RLS en tablas nuevas; secretos fuera del repo y de la sesión; migración aditiva; un PR por fase con CI verde; axe en pantallas nuevas.
- **Preguntar antes:** cambiar la frecuencia del cron; guardar algo del usuario en la caché del service worker; agregar otras dependencias aparte de `web-push`.
- **Nunca:** notificar sin permiso explícito; enviar más de una vez por día y tipo; exponer el `service_role` al cliente; correr E2E o Docker en la PC sin pedirlo.

## Pasos del owner (fuera del repo)

1. `npx web-push generate-vapid-keys` en su terminal → cargar las claves VAPID en Vercel.
2. Supabase → Settings → API → `service_role` → Vercel `SUPABASE_SERVICE_ROLE_KEY`.
3. `openssl rand -base64 32` → Vercel `REMINDERS_DISPATCH_SECRET` y Supabase Vault (`reminders_dispatch_secret`), más `reminders_dispatch_url` en Vault (SQL listo en `docs/deployment.md`).
4. En el iPhone: Safari → la app → Compartir → Agregar a inicio → abrir desde el ícono → Ajustes → Activar notificaciones.

## Criterios de éxito

- [ ] En el iPhone del owner: la app instalada abre a pantalla completa con ícono propio.
- [ ] El owner cambia su nombre en `/ajustes` y Hoy lo saluda con ese nombre, también después de cerrar sesión y volver a entrar con Google.
- [ ] La notificación de prueba llega al iPhone.
- [ ] Con la hora del cierre puesta 5 minutos adelante y sin cierre hecho, llega el recordatorio una sola vez; tocándolo abre el cierre.
- [ ] Con el cierre ya hecho, no llega.
- [ ] En modo avión, abrir la app muestra la pantalla "Sin conexión".
- [ ] CI verde (unitarios, E2E con axe, `design:check`); la migración aplica en producción por el deploy.

## Preguntas abiertas

1. Horas por defecto: Sesión 18:00 (apagado) y Cierre 21:30 (encendido). ¿Te sirven como punto de partida? (Se cambian desde la app.)
2. Ícono: propongo un anillo de progreso dorado sobre fondo oscuro, como el de la landing ("Así se ve tu progreso"). ¿Está bien, o prefieres otro símbolo?
