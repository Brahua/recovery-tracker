# Traspaso entre sesiones

> Punto de entrada para retomar el trabajo. Se actualiza al cerrar cada tarea o sesión, en vez de crear un archivo nuevo.
> Última actualización: 2026-10-01 (acceso por invitación, PR 1 de 5). Handoffs anteriores (con fecha) en `docs/archive/handoffs/`.

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
- **Auth en producción:** solo Google. Email y login anónimo apagados (verificado el 2026-10-01).
- **Funcionalidad:** MVP, rediseño, historial, series individuales, cierres con fecha anterior, catálogo de ejercicios, rutinas, nombre en el saludo, feedback global de carga, tratamientos del centro en Fisio guiada y edición de sesiones y cierres. Detalle en `CHANGELOG.md`.
- **Fase:** prueba de uso real. Tratamientos del centro para Fisio guiada (`docs/specs/physio-treatments-spec.md`) en producción desde el 2026-10-01: fase 1 (PR #23, migración `20261002000000_session_treatments.sql`) y fase 2, Insights y Reporte (PR #24). Probado por el owner en producción el 2026-10-01.
- **Editar o corregir registros pasados** (`docs/specs/edit-past-records-spec.md`): en producción desde el 2026-10-01. Cierres (PR #27), sesiones con la migración `20261003000000_edit_past_records.sql` (PR #28) y "Corregir" en las pantallas de éxito (PR 3). Incluye el arreglo de la hora de la sesión (el servidor la leía en UTC). **Falta que el owner lo pruebe en producción.** No hay una próxima feature elegida.

### Paso a producción (2026-09-30) ✅

- PR #8 integrado y desplegado desde CI: dominio con HTTPS, `NEXT_PUBLIC_SITE_URL` del dominio nuevo, Site URL y Redirect URLs en Supabase, login anónimo apagado.
- Verificado: el owner inició sesión con Google en el dominio nuevo (2026-10-01).
- Token viejo de Supabase revocado; `SUPABASE_ACCESS_TOKEN` nuevo (token de proyecto, vence en ~1 año: renovarlo antes y actualizar el secret). Probado con un workflow temporal: API 200 y `link` + `db push --dry-run` OK.
- PR #9 integrado y desplegado: cabeceras de seguridad (comprobadas en el dominio), guardia de la base de producción, axe en E2E y acciones de GitHub en `@v7`.

### En curso: acceso por invitación, onboarding y apariencia

Spec aprobada: `docs/specs/access-onboarding-personalization-spec.md` · Plan: `tasks/plan-access-onboarding.md` · Tareas: `tasks/todo-access-onboarding.md`. Cinco PRs en orden: (1) acceso por invitación en la base, (2) sección "Acceso" en Ajustes para el admin, (3) color principal, (4) tema claro, (5) onboarding.

- **PR 1, rama `feat/invite-only-access`:** migración `20261004000000_access_control.sql` (hook `before_user_created`, lista y modo), pgTAP en CI, pantalla "no invitado", ADR-005. **Después del deploy:** activar el hook en producción por la Management API y marcar al owner como admin (`docs/deployment.md` → "Acceso por invitación"). No activarlo antes: sin la función, todo registro nuevo falla.
- **PR 3 y 4 esperan los colores** del archivo `Recovery Tracker Design System.dc.html` de Claude Design. El owner va a conectar el MCP `claude_design` (`claude mcp add --transport http claude_design https://api.anthropic.com/v1/design/mcp`, reiniciar y `/design-login`).

| Rama | Estado |
|---|---|
| `feat/invite-only-access` | PR 1 abierto, esperando CI |

## ⏰ Vencimientos

| Qué | Cuándo | Acción |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` (secret de GitHub) | **~30 sep 2027** | Renovar a inicios de septiembre de 2027. Pasos en `docs/deployment.md` → "Vencimientos y renovaciones" |
| Certificado HTTPS | Cada ~90 días, automático | Nada, salvo que el dominio deje de responder por HTTPS |
| `VERCEL_TOKEN` | No vence | Nada |

Si el token de Supabase vence, el deploy falla con HTTP 401 al migrar y no publica nada; producción sigue funcionando.

## Protecciones automáticas

- `npm run supabase:push` y `supabase:push:linked` pasan por `scripts/check-db-target.mjs`: se niegan a escribir en un proyecto enlazado sin `ALLOW_PROD_DB=1`. Solo el job `deploy` de CI lo define. `supabase:push:dry` no cambia (solo lee).
- `playwright.config.ts` no arranca si `NEXT_PUBLIC_SUPABASE_URL` no es el Supabase local, y solo reutiliza un servidor ya levantado con `E2E_REUSE_SERVER=1`.
- `npm run design:check` (en CI) falla si una hoja de estilos fuera de `src/design-system/styles/tokens/` usa un color, curva o fuente literal.
- `next.config.ts` aplica a todas las rutas `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy`, `nosniff` y `Permissions-Policy`, y quita `X-Powered-By`.
- `tests/e2e/accessibility.spec.ts` corre axe (WCAG 2.1 A/AA) en todas las pantallas principales, con datos. Texto pequeño sobre fondo oscuro: usar `--rr-text-muted` o más claro (`--rr-text-dim` no llega a 4.5:1); texto verde sobre `--rr-accent-tint`: `--rr-accent-on-tint`.

## Contratos que deben preservarse

### Datos

- Varias sesiones por día; **un cierre por usuario y fecha** (también en la base). No hay cierres con fecha futura.
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

- Next 16: `params` y `searchParams` son `Promise`; leer `node_modules/next/dist/docs/` antes de tocar rutas o Server Actions.
- Dos GET idénticos de Supabase en el mismo render devuelven la respuesta memorizada: escribir antes de la única lectura.
- Los E2E comparten un usuario anónimo por corrida; usar nombres únicos (`uniqueName`) y, con la máquina cargada, `--workers=1`.
- CI: el job de E2E puede fallar por puertos ocupados en el runner; es infraestructura (`gh run rerun <id> --failed`).

## Próximos pasos

- **PWA y recordatorios: terminado y verificado en el iPhone (2026-10-01).** Spec: `docs/specs/pwa-and-reminders-spec.md`. Diagnóstico del cron y secretos: `docs/deployment.md` → "Envío programado de recordatorios". No hay feature en curso.
- Ícono de la app: editar `src/design-system/brand/app-icon.svg` y regenerar con `node scripts/pwa/render-icons.mjs`. El service worker es `public/sw.js` (subir `CACHE_VERSION` si cambia `offline.html`).
- El resto de lo pendiente está en **`docs/ideas/recovery-ritual-backlog.md`**.
