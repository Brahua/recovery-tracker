# Spec: acceso con Google, onboarding y personalización

Estado: **borrador v2 (2026-10-01)**: incorpora las respuestas del owner (paleta clara propuesta por el agente, anónimos permitidos por el hook, el owner ve el onboarding, administración de accesos en Ajustes). Colores confirmados desde Claude Design (2026-10-01).

## Objetivo

Hoy la app ya entra con Google (Supabase Auth; email y anónimo apagados, ADR-002), pero **cualquier cuenta de Google puede crear una cuenta**, nadie explica cómo funciona la app la primera vez y la apariencia es fija (solo oscura, verde).

Queremos tres cosas:

1. **Acceso por invitación, listo para abrirse.** Fase 1: solo entran los correos de una lista de permitidos. Más adelante el owner cambia **un solo ajuste** y entra cualquier cuenta de Google, sin tocar código ni desplegar.
2. **Onboarding completo** la primera vez: qué hace la app, cómo se usa cada parte y una configuración inicial rápida.
3. **Apariencia en Ajustes:** tema claro, oscuro o el del sistema, y color principal entre los 3 del diseño de Claude Design. Se guarda en la cuenta y se ve igual en el celular y en la PC.

**Usuario:** el owner y las pocas personas que invite (fase 1); después, cualquiera con Google. Uso principal en iPhone (PWA instalada).

### Criterios de aceptación

**Acceso (login y registro)**

1. El único método sigue siendo "Continuar con Google". El "registro" es el primer inicio de sesión: crea la cuenta si el acceso lo permite.
2. Una tabla de configuración guarda el modo de acceso: `invite_only` (por defecto) u `open`.
3. En `invite_only`, solo se crea la cuenta si el correo de Google está en la lista de permitidos (sin distinguir mayúsculas). Si no, **no se crea ninguna cuenta** y la persona ve una pantalla clara en español: "Recovery Ritual está en acceso por invitación." con "Intentar con otra cuenta" (abre el selector de cuentas de Google). Supabase no devuelve el correo rechazado, así que la pantalla no lo muestra.
4. En `open`, entra cualquier cuenta de Google (incluye Workspace). La lista se conserva pero no se consulta.
5. El bloqueo ocurre en la base (hook de Supabase `before_user_created`), no solo en la app: no se puede saltar llamando a la API de Supabase directamente.
6. Las cuentas que ya existen (la del owner) siguen entrando sin estar en la lista.
7. Los usuarios comunes no pueden leer ni cambiar la lista ni el modo (RLS sin políticas para `anon`/`authenticated`; todo pasa por funciones que verifican el rol de admin).
8. Los usuarios anónimos pasan el hook (sirven para los E2E; en producción el login anónimo está apagado).
9. Los errores de Google o de Supabase siguen yendo a `/auth/auth-code-error`, que distingue "no invitado" del resto.

**Administración de accesos (solo admin)**

10. El rol de admin vive en `app_metadata.role = "admin"` (el usuario no puede cambiarlo; solo el servidor de Supabase). Fase 1: solo la cuenta del owner, asignado por SQL una vez. La base lo lee de `auth.users` (no del JWT), así que darlo o quitarlo aplica en la siguiente acción, sin volver a iniciar sesión.
11. `/ajustes` → sección **"Acceso"**, visible solo para admin:
    - **Invitar:** campo de correo + botón "Invitar". Agrega el correo a la lista (validado, sin duplicados).
    - **Compartir:** cada invitado pendiente tiene "Compartir", que abre el menú de compartir del celular (Web Share API; si no existe, copia el texto) con un mensaje listo: "Te invité a Recovery Ritual… Entra con tu cuenta de Google (correo) en <URL de la app>". Es un botón aparte porque el menú de compartir necesita un toque directo.
    - **Lista de invitados:** correo, fecha y estado ("Pendiente" / "Ya entró", según exista la cuenta), con "Quitar" (con confirmación en la app, no `confirm()`).
    - **Modo de acceso:** estado actual ("Solo por invitación" / "Abierto") y un botón para cambiarlo ("Abrir a cualquier cuenta de Google" / "Volver a solo por invitación"), con confirmación que explica la consecuencia.
12. Toda acción de admin se verifica en la base (funciones `security definer` que revisan el rol en `auth.users`), no solo ocultando la sección. Un no admin que llama a la acción recibe un error.
13. Quitar un correo impide que se cree la cuenta si aún no entró; si ya entró, su cuenta sigue activa (ver Fuera de alcance).

**Onboarding**

14. La primera vez que una cuenta entra (sin `onboarding_completed_at` en `user_metadata`), la app la lleva a `/bienvenida` antes de cualquier otra pantalla autenticada.
15. `/bienvenida` tiene dos partes:
    - **Recorrido** (5–6 tarjetas que se deslizan, con indicador de paso, "Siguiente", "Atrás" y "Saltar"): Hoy y la racha, Registrar sesión (rutinas, ejercicios, series, tratamientos), Cierre nocturno, Historial y cómo corregir, Insights y Reporte para la consulta, Instalar y recordatorios. Cada tarjeta usa una ilustración o captura estilizada de la pantalla real.
    - **Configuración rápida:** nombre ("¿Cómo quieres que te llamemos?"), tema y color principal (con vista previa al instante) y aceptar el aviso "No sustituye consejo médico".
16. Al terminar (o al saltar) se guarda `onboarding_completed_at` y va a Hoy. Saltar no exige el aviso médico, que queda visible en el pie de Ajustes.
17. En Ajustes, "Ver el recorrido otra vez" abre el recorrido sin repetir la configuración.
18. Funciona con teclado y lector de pantalla (axe sin violaciones) y respeta "reducir movimiento".

**Apariencia**

19. `/ajustes` → nueva sección "Apariencia": **Tema** (Oscuro, Claro, Sistema) y **Color principal** (3 opciones con muestra y nombre). Cambiar se ve al instante y se guarda solo, con toast de confirmación.
20. Por defecto: tema Oscuro y el verde actual. Nadie ve un cambio si no toca nada.
21. Se guarda en `user_metadata.preferences = { theme, accent }` (como `display_name`, sin migración) y se valida con zod en el servidor (valores fuera de la lista se rechazan).
22. **Sin parpadeo:** un script inline mínimo en `<head>` (patrón de la guía de Next 16, `preventing-flash-before-hydration.md`) lee la cookie espejo `rr-appearance` y pone `<html data-theme data-accent>` antes de pintar; así las páginas estáticas (`/offline`) siguen estáticas. La cookie la escribe el navegador al elegir y `AppearanceSync` (layout de la app) la alinea con la cuenta tras iniciar sesión o cambiar en otro dispositivo. Con "Sistema", el CSS decide con `prefers-color-scheme`.
23. Tema claro completo en todas las pantallas autenticadas, con contraste WCAG AA en los dos temas y con los 3 colores (axe en E2E para cada combinación de tema; colores revisados con un chequeo de contraste por token).
24. El color de la barra del navegador (`theme-color`) sigue el tema elegido (`applyAppearance`). La barra de estado de la app instalada en iPhone sigue negra: iOS la fija al abrir la app (`apple-mobile-web-app-status-bar-style`).
25. La landing (sin sesión) sigue oscura: su foto y diseño son oscuros y todavía no hay preferencias.

### Fuera de alcance

- Enviar la invitación por correo desde la app (necesita un servicio de email; la invitación se comparte por WhatsApp/mensajes con el menú de compartir). Se puede agregar después sin cambiar la lista.
- Varios admins o roles más finos.
- Otros métodos de acceso (email, Apple, enlace mágico).
- Expulsar a alguien ya registrado al quitarlo de la lista (se hace con "Ban user" en el panel de Supabase; queda documentado).
- Selector de color libre, tamaño de texto y más opciones de apariencia.
- Datos clínicos en el registro (rodilla, fecha de cirugía, fisio): feature aparte si se quiere.
- Tooltips sobre la interfaz real ("coach marks"): frágiles en móvil; el recorrido de tarjetas cubre lo mismo.

## Arquitectura

### Acceso

```
Google ──► Supabase Auth ──► hook before_user_created (Postgres)
                               │  modo open → permitir
                               │  invite_only → ¿email en access_allowlist? sí → permitir
                               │                                          no → error "not_invited"
                               ▼
                         /auth/callback ──► error=access_denied… → /auth/auth-code-error?reason=not_invited
```

- `public.app_access_settings` (una sola fila, `mode text check (mode in ('invite_only','open'))`).
- `public.access_allowlist` (`email text primary key`, guardado recortado y en minúsculas por un `check`; `note text`, `created_at`). Sin `citext` para no sumar extensiones.
- Función `public.before_user_created_hook(event jsonb)` con `security definer`, `grant execute` solo a `supabase_auth_admin`; RLS activado en ambas tablas, sin políticas para usuarios. Deja pasar `is_anonymous`.
- Funciones de admin (`security definer`, `grant execute` a `authenticated`, cada una llama a `require_app_admin()`, que lee el rol de `auth.users`): `admin_list_access()` (lista + modo + si el correo ya tiene cuenta), `admin_invite_email(email)`, `admin_remove_email(email)`, `admin_set_access_mode(mode)`. Server Actions en `src/features/access/actions.ts` las llaman con el cliente del usuario (sin `service_role`).
- La página de Ajustes decide si muestra "Acceso" con `user.app_metadata.role`; la base vuelve a verificarlo en cada acción.
- Local: `[auth.hook.before_user_created]` en `supabase/config.toml`. Producción: activar el hook en el proyecto `pevrupenrzueyzidfeah` con la Management API (lo hace el agente con comandos que no imprimen secretos, ver memoria del proyecto) **después** de que CI aplique la migración, y sembrar el correo del owner en la lista.
- Los E2E usan un usuario anónimo, que el hook deja pasar. Para probar "Acceso", `tests/e2e/admin-helpers.ts` lo promueve a admin con la `service_role` del Supabase local (leída de `supabase status`, nunca de un archivo de entorno) y lo vuelve a quitar al final.

### Onboarding

- `src/app/(app)/layout.tsx` ya carga el usuario: si falta `onboarding_completed_at`, redirige a `/bienvenida` (excepto si ya está ahí).
- `/bienvenida` vive fuera del shell (sin barra de pestañas), como la landing.
- Server Actions en `src/features/onboarding/actions.ts`: `completeOnboardingAction` (nombre, apariencia, aviso → `updateUser` + cookie + `revalidatePath("/", "layout")`).
- El recorrido es un componente cliente con scroll-snap (deslizar en móvil) y botones; sin dependencias nuevas.

### Apariencia

- Tokens: `colors.css` pasa a definir la paleta oscura en `:root`, la clara en `[data-theme="light"]` y en `@media (prefers-color-scheme: light) { [data-theme="system"] }`, y cada color principal en `[data-accent="…"]` (`--rr-accent`, `--rr-accent-light`, `--rr-accent-rgb`, `--rr-accent-on-tint`, `--rr-accent-text`, …).
- Paso previo sin cambio visual: los tokens derivados que hoy repiten `46, 125, 91` (`--rr-accent-tint`, `--rr-accent-border`, `--rr-accent-card`, `--rr-selection`) se reescriben con `rgb(var(--rr-accent-rgb) / …)`. Se prueba con `css:compare` que el CSS compilado resuelto no cambia.
- Las superficies ya usan tokens (`rgb(var(--rr-ink-rgb) / …)` en ~236 lugares), así que el tema claro se basa en redefinir tokens; las superficies con fondos fijos oscuros (noche, éxito, foto) se revisan una por una.
- `src/lib/appearance.ts`: tipos, valores por defecto, parseo de la cookie y de `user_metadata`, y el `themeColor` por tema. `src/app/layout.tsx` lee la cookie con `cookies()` y pinta los atributos.

## Datos

- Migración nueva y aditiva: `supabase/migrations/20261004000000_access_control.sql` (tablas, hook, permisos, fila `invite_only`). No toca tablas existentes.
- `app_metadata.role = "admin"` en la cuenta del owner (un `update` por SQL en producción, fuera del repo).
- `user_metadata` (sin migración): `onboarding_completed_at` (ISO), `medical_notice_accepted_at` (ISO), `preferences: { theme: "dark" | "light" | "system", accent: <id> }`.

## Tech stack

Next 16 (App Router, Server Actions, `params`/`searchParams` como `Promise`; leer `node_modules/next/dist/docs/` antes de tocar rutas, `cookies()` y metadata), Supabase Auth + Postgres, zod, Vitest, Playwright + axe. **Sin dependencias nuevas.**

## Estructura

```
supabase/migrations/20261004000000_access_control.sql   → tablas + hook
supabase/config.toml                                   → hook activado en local
src/app/auth/auth-code-error/page.tsx                  → mensaje "no invitado"
src/lib/auth-callback-error.ts                         → razón not_invited
src/app/(app)/bienvenida/page.tsx                      → onboarding (fuera del shell)
src/features/onboarding/{tour.tsx,setup-form.tsx,actions.ts,tour-steps.ts}
src/features/access/{access-settings.tsx,actions.ts}       → sección Acceso (admin)
src/lib/validation/access.ts (+ .test.ts)
src/features/settings/appearance-settings.tsx          → sección Apariencia
src/features/settings/actions.ts                       → saveAppearanceAction
src/lib/appearance.ts (+ .test.ts)                     → tipos, defaults, cookie
src/lib/validation/appearance.ts (+ .test.ts)
src/design-system/styles/tokens/colors.css             → paletas oscura/clara y acentos
src/design-system/styles/surfaces/onboarding.css
tests/e2e/onboarding.spec.ts, appearance.spec.ts       → + axe por tema
docs/decisions/ADR-005-invite-only-access.md
```

## Estilo de código

Igual que el resto: código en inglés, UI en español, Server Actions que devuelven `{ ok, error? }` y validan con zod, comentarios solo donde el porqué no es obvio.

```ts
// src/lib/appearance.ts
export const themes = ["dark", "light", "system"] as const;
export type Theme = (typeof themes)[number];

export const defaultAppearance = { theme: "dark", accent: "green" } satisfies Appearance;

// The cookie mirrors user_metadata.preferences so the root layout can paint the theme
// without waiting for Supabase; the account stays the source of truth.
export function parseAppearanceCookie(value: string | undefined): Appearance { … }
```

## Comandos

```
nvm use
npm run format && npm run lint && npm run design:check && npm run typecheck && npm test
npm run -s css:compare -- compare <baseline> --resolve   # paso de tokens sin cambio visual
```

`next build`, E2E y Supabase local corren en CI (límites de la máquina).

## Estrategia de pruebas

- **Unitarias (Vitest):** parseo/validación de apariencia y cookie, `themeColor`, razón `not_invited` del callback, decisión de redirigir a `/bienvenida`, pasos del recorrido.
- **SQL (en CI, Supabase local):** el hook permite/rechaza según modo y lista, sin distinguir mayúsculas, y permite anónimos/existentes; las funciones de admin rechazan a quien no es admin.
- **E2E (CI):** un admin invita, ve el correo como "Pendiente" y lo quita; un no admin no ve "Acceso"; onboarding completo y "Saltar"; volver a ver el recorrido; cambiar tema y color en Ajustes y que persista al recargar sin parpadeo; axe en las pantallas principales en tema claro y oscuro.
- **Contraste:** script o test que verifica AA para los pares texto/fondo de cada tema × color.
- **Manual (owner, en producción):** invitar un correo y entrar; un correo no invitado ve el mensaje y no queda cuenta creada; tema y color en el iPhone instalado.

## Límites

- **Siempre:** migración aditiva; validar en el servidor; correr el chequeo completo antes de cada commit; un PR por fase con CI verde.
- **Preguntar antes:** pasar el modo a `open` por SQL (el owner sí puede hacerlo desde Ajustes); agregar dependencias; cambiar el diseño de la landing; cualquier cambio en la configuración de Auth de producción distinto de activar el hook.
- **Nunca:** imprimir o commitear secretos; correr Docker, `next build` o E2E en la PC del owner sin que lo pida; borrar o expulsar usuarios existentes.

## Plan por fases (detalle en `tasks/plan.md` tras aprobar)

1. **Acceso por invitación:** migración + hook + pantalla "no invitado" + ADR-005 + activar el hook en producción y marcar al owner como admin.
2. **Acceso en Ajustes (admin):** funciones de admin, sección "Acceso" (invitar y compartir, lista, modo).
3. **Tokens y apariencia (oscuro):** tokens de acento con `rgb(var())` sin cambio visual, 3 colores, preferencias en la cuenta, cookie, sección Apariencia.
4. **Tema claro:** paleta clara, revisión de superficies, `themeColor`, axe y contraste en los dos temas.
5. **Onboarding:** `/bienvenida`, recorrido, configuración rápida, "Ver el recorrido otra vez".

## Criterios de éxito

- Un correo no invitado no crea cuenta y ve el mensaje; uno invitado desde Ajustes entra; pasar el interruptor a "Abierto" abre el acceso sin desplegar.
- Una cuenta nueva pasa por el onboarding una sola vez y llega a Hoy con su nombre, tema y color.
- Tema y color se ven igual tras recargar y en otro dispositivo, sin parpadeo.
- axe sin violaciones en tema claro y oscuro; CI verde en cada fase.

## Colores (Claude Design, 2026-10-01)

Fuente: proyecto de Claude Design `74a9f44b-…` (`docs/design/claude-design-reference.md`).

- **Color principal:** las opciones del ajuste "Estilo → accentColor" de `Recovery Tracker Hoy.dc.html`: **Verde recuperación `#2E7D5B`** (por defecto), **Terracota `#C9552E`** y **Ámbar `#B08A2E`**. El diseño deriva de cada uno: claro = mezcla del 18% hacia blanco, brillo 18%, sombra 50%, tinte 22%, borde 35%.
- **Terracota:** en el design system también codifica el dolor (slider, "peor"). Decisión (2026-10-01, delegada al agente): con terracota como principal, los tokens de dolor pasan a frambuesa (`#d4426e` y su familia, misma luminancia, mismo contraste).
- **Texto sobre el acento:** tokens `--rr-on-accent`, `--rr-on-accent-bright` y `--rr-on-accent-mark` (fijos, no dependen del tema). El ámbar es claro: lleva texto carbón.
- **Tema claro (PR 4, propuesto por el agente con aprobación delegada por el owner):** base "Papel": fondo `#f6f2eb`, superficie `#fdfbf7`, tinta carbón `#1c1915`. El acento como texto, el dolor y la noche se oscurecen para papel (≥ 4,8:1). El texto con transparencia usa `calc(alpha * var(--rr-text-alpha))`: 1 en oscuro y 1,45 en claro, porque la misma opacidad contrasta menos sobre fondo claro. La landing queda oscura con `.rr-theme-dark`.

## Decisiones tomadas (2026-10-01)

- Paleta clara: la propone el agente a partir de la oscura y el owner la revisa antes del PR del tema claro.
- El hook deja pasar a los usuarios anónimos.
- El owner pasa por el onboarding una vez, para revisarlo.
- No hay lista inicial: el owner invita desde Ajustes → "Acceso". La invitación se comparte con el menú del celular; no se envía email.
