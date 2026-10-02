# Traspaso entre sesiones

> Punto de entrada para retomar el trabajo. Se actualiza al cerrar cada tarea o sesión, en vez de crear un archivo nuevo.
> Última actualización: 2026-10-02 (app de rehabilitación en general: texto neutro, lesión activa, rigidez, tipos de sesión y metas).

## Cómo retomar

1. Leer este archivo, `AGENTS.md`, `RECAP.md` y `docs/deployment.md`.
2. `gh auth switch -u Brahua` antes de usar `gh`.
3. Revisar las ramas abiertas (tabla de abajo) antes de crear otra.

## Límites de la máquina (no negociables)

- En la PC del owner **no** se corre Docker (Supabase local), `next build` ni E2E, salvo que lo pida en esa sesión: la PC se colgó antes. Lo normal es `npm run lint`, `npm run typecheck` y `npm test`; el build y los E2E corren en CI.
- El puerto 3000 suele estar ocupado por otro proyecto (`brahua-os`); no detener procesos ajenos.
- `npm run dev` con `.env.local` apuntando a producción es aceptable para revisar visualmente **si el owner lo pide**, sin crear datos de prueba.

## Estado

- **Producción:** https://recovery-tracker.brahua.com. El antiguo staging (Supabase `pevrupenrzueyzidfeah`) es producción desde el 2026-09-30 (ADR-004). Tiene los datos reales de una cuenta.
- **Auth en producción:** solo Google. Email y login anónimo apagados (verificado el 2026-10-01). Acceso por invitación activo desde el 2026-10-01 (ADR-005); para invitar: Ajustes → Acceso (solo el admin).
- **Funcionalidad:** MVP, rediseño, historial, series individuales, cierres con fecha anterior, catálogo de ejercicios, rutinas, nombre en el saludo, feedback global de carga, tratamientos del centro en Fisio guiada y edición de sesiones y cierres. Detalle en `CHANGELOG.md`.
- **Fase:** prueba de uso real. Tratamientos del centro para Fisio guiada (`docs/specs/physio-treatments-spec.md`) en producción desde el 2026-10-01: fase 1 (PR #23, migración `20261002000000_session_treatments.sql`) y fase 2, Insights y Reporte (PR #24). Probado por el owner en producción el 2026-10-01.
- **Editar o corregir registros pasados** (`docs/specs/edit-past-records-spec.md`): en producción desde el 2026-10-01. Cierres (PR #27), sesiones con la migración `20261003000000_edit_past_records.sql` (PR #28) y "Corregir" en las pantallas de éxito (PR 3). Incluye el arreglo de la hora de la sesión (el servidor la leía en UTC). **Falta que el owner lo pruebe en producción.** No hay una próxima feature elegida.

### Paso a producción (2026-09-30) ✅

- PR #8 integrado y desplegado desde CI: dominio con HTTPS, `NEXT_PUBLIC_SITE_URL` del dominio nuevo, Site URL y Redirect URLs en Supabase, login anónimo apagado.
- Verificado: el owner inició sesión con Google en el dominio nuevo (2026-10-01).
- Token viejo de Supabase revocado; `SUPABASE_ACCESS_TOKEN` nuevo (token de proyecto, vence en ~1 año: renovarlo antes y actualizar el secret). Probado con un workflow temporal: API 200 y `link` + `db push --dry-run` OK.
- PR #9 integrado y desplegado: cabeceras de seguridad (comprobadas en el dominio), guardia de la base de producción, axe en E2E y acciones de GitHub en `@v7`.

### Acceso por invitación, apariencia y onboarding ✅ (2026-10-01)

Spec: `docs/specs/access-onboarding-personalization-spec.md` · Plan: `tasks/plan-access-onboarding.md` · Tareas: `tasks/todo-access-onboarding.md`.

- **Acceso (#34, #36):** hook `before_user_created` **activo** en producción, modo `invite_only`, el owner es admin (`app_metadata.role`). Ajustes → Acceso: invitar, compartir, quitar y abrir el acceso. Pasos y SQL en `docs/deployment.md` → "Acceso por invitación".
- **Apariencia (#37, #39):** Ajustes → Apariencia con tema (Oscuro, Claro, Sistema) y color (Verde, Terracota, Ámbar, de Claude Design). Script inline en `src/app/layout.tsx` + cookie `rr-appearance` + `AppearanceSync`; la cuenta (`user_metadata.preferences`) manda. Tokens claros en `tokens/colors.css` (dos copias idénticas, verificadas por test); el texto translúcido usa `--rr-text-alpha`. La landing queda oscura (`.rr-theme-dark`).
- **Onboarding (#40):** `/bienvenida` para cuentas nuevas (recorrido de 6 tarjetas + configuración rápida, o "Saltar"); se repite desde Ajustes → Cuenta. El owner lo verá una vez al entrar.
- **Cerrar sesión en el celular (#38):** Ajustes → Cuenta.
- MCP `claude_design` conectado en este equipo (configuración local); proyecto de diseño en `docs/design/claude-design-reference.md`.
- Los 3 usuarios anónimos del 2026-09-16 (sin datos en ninguna tabla) se borraron el 2026-10-02 con el OK del owner. En producción solo queda la cuenta del owner.
- **Probado por el owner en producción (2026-10-02).** En la app instalada en iPhone, la barra de estado sigue negra con el tema claro: iOS la fija al abrir (`apple-mobile-web-app-status-bar-style`).

### App de rehabilitación en general ✅ (2026-10-02)

Spec: `docs/specs/general-rehab-spec.md`. La app ya no es solo de rodilla; sigue pensada para el paciente (sin mediciones clínicas) y con **una lesión activa** por cuenta.

- **Fase 0 (#47):** textos neutros en landing, manifest, invitación, onboarding, registro, cierre y Hoy.
- **Fase 1 (#48):** `user_metadata.condition` (zona, lado, tipo, fecha), sin migración. Ajustes → Mi recuperación y paso opcional en el onboarding; Hoy y Reporte la muestran y los textos nombran la zona. Se valida al guardar y al leer (`parseCondition`). El owner debe elegir su lesión en Ajustes (no se asumió ninguna para la cuenta existente).
- **Fase 2:** `nightly_closeouts.stiffness_level` (opcional) y tipos de sesión Movilidad, Equilibrio y Respiración (migración `20261007000000`).
- **Fase 3:** `recovery_goals` ("Mis metas" en Hoy, hasta 10 pendientes, listadas en el Reporte; migración `20261008000000`).
- **Backlog:** etapa de la recuperación, módulo de documentos médicos y portal para fisios (spec propia, con las decisiones ya tomadas) están en `docs/ideas/recovery-ritual-backlog.md`.
- **`gh` en esta máquina:** la función `gh` del shell elige la cuenta por carpeta, pero en el Bash de Claude devolvía `jbrahua`; funciona `GH_TOKEN="$(env -u GH_TOKEN command gh auth token --user Brahua)" command gh …`.

### Arreglos posteriores (2026-10-02) ✅

- Barra inferior igual en todos los módulos (#42) y un solo encabezado: `.rr-page-title` con `.rr-kicker`, sin flecha en los módulos de la barra; la flecha solo en sub-pantallas (#42, #44).
- Cierre del día con fecha y hora: `nightly_closeouts.closed_time` (#43).
- Repo público (revisado sin secretos en el historial) y `main` protegida con el ruleset "Protect main" (#45).

No hay ramas abiertas ni PRs pendientes.

## ⏰ Vencimientos

| Qué | Cuándo | Acción |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` (secret de GitHub) | **~30 sep 2027** | Renovar a inicios de septiembre de 2027. Pasos en `docs/deployment.md` → "Vencimientos y renovaciones" |
| Certificado HTTPS | Cada ~90 días, automático | Nada, salvo que el dominio deje de responder por HTTPS |
| `VERCEL_TOKEN` | No vence | Nada |

Si el token de Supabase vence, el deploy falla con HTTP 401 al migrar y no publica nada; producción sigue funcionando.

## Protecciones automáticas

- `main` tiene el ruleset "Protect main": solo entra por PR con "Lint · Typecheck · Unit" y "E2E (Supabase local + Playwright)" en verde, sin force-push ni bypass. Detalle en `docs/deployment.md` → "Protección de `main`". El repo es público desde el 2026-10-02.

- `npm run supabase:push` y `supabase:push:linked` pasan por `scripts/check-db-target.mjs`: se niegan a escribir en un proyecto enlazado sin `ALLOW_PROD_DB=1`. Solo el job `deploy` de CI lo define. `supabase:push:dry` no cambia (solo lee).
- `playwright.config.ts` no arranca si `NEXT_PUBLIC_SUPABASE_URL` no es el Supabase local, y solo reutiliza un servidor ya levantado con `E2E_REUSE_SERVER=1`.
- `npm run design:check` (en CI) falla si una hoja de estilos fuera de `src/design-system/styles/tokens/` usa un color, curva o fuente literal.
- `next.config.ts` aplica a todas las rutas `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy`, `nosniff` y `Permissions-Policy`, y quita `X-Powered-By`.
- `tests/e2e/accessibility.spec.ts` corre axe (WCAG 2.1 A/AA) en todas las pantallas principales, con datos. Texto pequeño sobre fondo oscuro: usar `--rr-text-muted` o más claro (`--rr-text-dim` no llega a 4.5:1); texto verde sobre `--rr-accent-tint`: `--rr-accent-on-tint`.

## Contratos que deben preservarse

### Datos

- Varias sesiones por día; **un cierre por usuario y fecha** (también en la base). No hay cierres con fecha futura.
- La hora del cierre es `closed_time` (hora del día en Lima), aparte de `date`: un cierre a las 00:30 de la noche del 1 sigue siendo del día 1. El formulario la envía junto con la fecha como `closedAt` (`splitCloseoutDateTime`).
- El "día" se calcula en `America/Lima`; los timestamps se guardan en UTC.
- Historial solo muestra datos (y lleva a editarlos); las interpretaciones van en Insights y Reporte.
- Editar una sesión la reemplaza entera en una transacción (`update_rehab_session`, que comparte `insert_rehab_session_children` con `create_rehab_session`): un cambio en cómo se guardan los hijos va en esa función.
- Las horas del formulario de sesión son de Lima y el servidor corre en UTC: convertir con `parseRecoveryDateTimeLocal` / `toRecoveryDateTimeLocal`, nunca con `new Date(valor)`.
- Lecturas por lotes, nunca N+1. Un archivo `"use server"` solo exporta funciones async.
- Migraciones aditivas; algo destructivo necesita el OK del owner y un backup.

### Catálogo, registro y rutinas

- `session_exercises.name` es una copia histórica; `exercise_id` enlaza con el catálogo. Renombrar no reescribe sesiones.
- La normalización de nombres coincide en SQL (`normalize_exercise_name`, con `unaccent`) y TS (`normalizeExerciseName`).
- El guardado de sesión es atómico (`create_rehab_session`), con `resolve_exercise_for_user`; no se repiten ejercicios en una sesión ni en una rutina.
- Nada con historial se borra: se archiva o se fusiona (`merge_exercises`).
- Las rutinas son plantillas: usarlas solo prellena; muestran el nombre actual del ejercicio; `save_routine` reemplaza la rutina entera en una transacción.

### UI

- `next/link` está prohibido por lint: usar `@/components/app-link`, o la barra de progreso no reacciona.
- La racha vive en el layout: toda acción que la afecte llama `revalidatePath("/", "layout")`.
- `--rr-bottom-nav-offset` es la altura de la barra de pestañas; todo elemento fijo al fondo la usa.
- Toasts en E2E: `toast(page, "…")`; afirmarlos antes de navegar (duran 4,5 s).

## Trampas técnicas

- Título de cada módulo: `<h1 className="rr-page-title">` con `<p className="rr-kicker">` encima; las pantallas no le ponen tamaño, peso ni color propios al título. Los módulos de la barra inferior no llevan flecha de volver; solo las sub-pantallas (editar sesión o cierre, editor de rutinas). La barra inferior tiene un solo estilo (`surfaces/shell.css`).

- Al mergear un PR con varios commits, `gh pr merge --squash` usa el título del PR (en español) como commit: pasar `--subject "feat: … (#N)"` en inglés (pasó en #39).
- Apariencia: `<html data-theme data-accent>` lo pone un script inline antes de pintar (cookie `rr-appearance`); un color nuevo en una superficie debe usar tokens que existan en los dos temas, y el texto translúcido `calc(alpha * var(--rr-text-alpha))`. axe corre en claro y en oscuro (`tests/e2e/appearance.spec.ts`).
- Una cuenta nueva va a `/bienvenida` hasta tener `onboarding_completed_at`; el usuario compartido de E2E lo salta en `auth.setup.ts`.

- Next 16: `params` y `searchParams` son `Promise`; leer `node_modules/next/dist/docs/` antes de tocar rutas o Server Actions.
- Dos GET idénticos de Supabase en el mismo render devuelven la respuesta memorizada: escribir antes de la única lectura.
- Los E2E comparten un usuario anónimo por corrida; usar nombres únicos (`uniqueName`) y, con la máquina cargada, `--workers=1`.
- CI: el job de E2E puede fallar por puertos ocupados en el runner; es infraestructura (`gh run rerun <id> --failed`).

## Próximos pasos

- **No hay feature en curso.** La siguiente se elige del backlog (`docs/ideas/recovery-ritual-backlog.md`).
- Para abrir la app a cualquier cuenta de Google: Ajustes → Acceso → "Abrir a cualquier cuenta de Google" (sin desplegar).
- PWA y recordatorios: diagnóstico del cron y secretos en `docs/deployment.md` → "Envío programado de recordatorios".
- Ícono de la app: editar `src/design-system/brand/app-icon.svg` y regenerar con `node scripts/pwa/render-icons.mjs`. El service worker es `public/sw.js` (subir `CACHE_VERSION` si cambia `offline.html`).
