# Traspaso entre sesiones

> Punto de entrada para retomar el trabajo. Se actualiza al cerrar cada tarea o sesión, en vez de crear un archivo nuevo.
> Última actualización: 2026-09-30. Handoffs anteriores (con fecha) en `docs/archive/handoffs/`.

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
- **Funcionalidad:** MVP, rediseño, historial, series individuales, cierres con fecha anterior, catálogo de ejercicios, rutinas, nombre en el saludo y feedback global de carga. Detalle en `CHANGELOG.md`.
- **Fase:** prueba de uso real. No hay una próxima feature elegida.

### Paso a producción (2026-09-30) ✅

- PR #8 integrado y desplegado desde CI: dominio con HTTPS, `NEXT_PUBLIC_SITE_URL` del dominio nuevo, Site URL y Redirect URLs en Supabase, login anónimo apagado.
- Verificado: el login con Google arranca desde el dominio nuevo y Supabase acepta volver a `https://recovery-tracker.brahua.com/auth/callback`. Falta que el owner complete un login real.
- Token viejo de Supabase revocado; `SUPABASE_ACCESS_TOKEN` nuevo (token de proyecto, vence en ~1 año: renovarlo antes y actualizar el secret). Probado con un workflow temporal: API 200 y `link` + `db push --dry-run` OK.
- Opcional pendiente: apagar el proveedor Email en Supabase (la app solo usa Google).

### Rama abierta

| Rama | Contenido |
|---|---|
| `chore/security-headers-db-guard-a11y` | Cabeceras de seguridad, guardia contra escribir en la base de producción, axe en E2E con correcciones de contraste, este handoff |

## Protecciones automáticas

- `npm run supabase:push` y `supabase:push:linked` pasan por `scripts/check-db-target.mjs`: se niegan a escribir en un proyecto enlazado sin `ALLOW_PROD_DB=1`. Solo el job `deploy` de CI lo define. `supabase:push:dry` no cambia (solo lee).
- `playwright.config.ts` no arranca si `NEXT_PUBLIC_SUPABASE_URL` no es el Supabase local, y solo reutiliza un servidor ya levantado con `E2E_REUSE_SERVER=1`.
- `next.config.ts` aplica a todas las rutas `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy`, `nosniff` y `Permissions-Policy`, y quita `X-Powered-By`.
- `tests/e2e/accessibility.spec.ts` corre axe (WCAG 2.1 A/AA) en todas las pantallas principales, con datos. Texto pequeño sobre fondo oscuro: usar `--rr-text-muted` o más claro (`--rr-text-dim` no llega a 4.5:1); texto verde sobre `--rr-accent-tint`: `--rr-accent-on-tint`.

## Contratos que deben preservarse

### Datos

- Varias sesiones por día; **un cierre por usuario y fecha** (también en la base). No hay cierres con fecha futura.
- El "día" se calcula en `America/Lima`; los timestamps se guardan en UTC.
- Historial solo muestra datos; las interpretaciones van en Insights y Reporte.
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

## Próximos pasos sugeridos

1. Merge de `chore/security-headers-db-guard-a11y` con CI en verde; comprobar las cabeceras en el dominio.
2. Revisión manual del loading y los toasts en móvil (D5 de `tasks/todo-global-loading-feedback.md`).
3. Retomar la prueba de uso real para elegir la siguiente feature. Ideas sin aprobar: guardar qué rutina se usó, editar registros pasados, análisis por ejercicio.
4. Más adelante: Prettier en CI y dividir `globals.css` (136 KB) en tokens y componentes, con su propia spec.
