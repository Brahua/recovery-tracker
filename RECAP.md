# Recap — Recovery Ritual (`recovery-tracker`)

> Resumen rápido del proyecto: de qué va, cómo está construido, en qué fase está y cómo empezar a desarrollar.
> Última actualización: 2026-09-30. Para el detalle, seguir los enlaces a `README.md`, `docs/` y `tasks/`.

## 1. Qué es

App en español, pensada primero para el celular, para llevar el control de la rehabilitación después de una cirugía de rodilla. Tiene cuatro flujos principales:

- **Registrar sesión:** lo que se anota al salir de terapia.
- **Cierre del día:** el registro de cada noche.
- **Insights:** tendencias de dolor, carga, sueño y ejercicios.
- **Reporte:** un resumen para llevar a la cita con el médico o el fisio.

Brief original: `recovery_tracker_app_brief.md`. Visión del producto: `docs/ideas/recovery-ritual.md`.

## 2. Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16.2.10** (App Router, carpeta `src/`, Server Actions, `proxy.ts` en lugar de `middleware.ts`) |
| UI | React 19.2, Tailwind CSS 4 |
| Validación | Zod 4 |
| Backend y datos | **Supabase** (Postgres con RLS, Auth con Google OAuth; login anónimo solo para tests), usando `@supabase/ssr` directamente, sin API propia |
| Tests | Vitest (94 tests unitarios), Playwright (9 E2E) |
| CI/CD | GitHub Actions → Supabase + Vercel (trunk-based, igual que `brahua-os`) |
| Hosting | Vercel: `brahua-lab/recovery-tracker`, en **https://recovery-tracker.brahua.com** |
| Node | 24 (`.nvmrc`) |

⚠️ `AGENTS.md` pide leer `node_modules/next/dist/docs/` antes de tocar rutas, formularios o Server Actions, porque Next 16 cambia varias APIs.

## 3. Cómo está construido

```
src/
  app/            Rutas: / (Hoy o landing), /registrar, /historial, /insights, /reporte, /ejercicios, /auth/*
  features/       UI por dominio: check-in (post-therapy, nightly-closeout, test-auth), history, today, dashboard, reports
  components/     Shell, landing, estados de éxito, editor de ejercicios, slider de dolor
  lib/            Lógica pura con tests: view-models, cálculos, insights, fechas (America/Lima), validación Zod, clientes Supabase
  data/           recovery-log-repository.ts (acceso a la BD) + mappers
  types/          Tipos del dominio
supabase/migrations/   Migraciones: esquema base, series de ejercicios e historial, permisos de API, catálogo de ejercicios y rutinas
proxy.ts          Refresca la sesión de Supabase en cada request
```

**Patrón:** el componente de servidor pide los datos al repositorio, un *view-model* puro (con tests) los prepara y el componente los muestra. Los formularios usan Server Actions con `useActionState`, y el servidor vuelve a validar todo.

**Decisiones documentadas (ADR):** `docs/decisions/ADR-001` (Supabase directo), `ADR-002` (Google login), `ADR-003` (las series se guardan agregando datos, sin reemplazar los anteriores) y `ADR-004` (staging pasa a ser producción, flujo trunk-based).

### Reglas que no hay que romper

Vienen de `docs/specs/session-handoff-2026-07-17.md`:

- Se permiten varias sesiones por día. Solo puede haber **un cierre por usuario y fecha**, y la base de datos también lo impide.
- No se aceptan cierres con fecha futura.
- El "día" se calcula en `America/Lima`, pero los timestamps se guardan en UTC.
- Historial solo muestra datos. Las interpretaciones van en Insights y Reporte.
- Las lecturas se hacen por lotes, nunca una consulta por registro (N+1).
- Un archivo con `"use server"` solo puede exportar funciones async.

## 4. En qué fase está

- **Terminado:** el MVP, el rediseño con Claude Design (8 pantallas), el historial, las series individuales, los registros con fecha anterior, el CI/CD, el catálogo de ejercicios (`/ejercicios`), las rutinas y el feedback global de carga (barra de progreso, toasts y pantalla de error).
- **Última verificación documentada (2026-07-17):** todo pasaba (tests, typecheck, lint, build, E2E). Lighthouse dio 100 en accesibilidad.
- **Fase actual:** prueba de uso real. **No hay una próxima feature elegida.**
- **Ideas pendientes sin aprobar:** editar registros pasados, rutinas reutilizables y análisis por ejercicio. El resto está en `docs/ideas/recovery-ritual-backlog.md`.
- **Entornos:** desde el 2026-09-30 el antiguo staging **es producción** (ADR-004). Hay un solo entorno hospedado: Supabase `pevrupenrzueyzidfeah` y https://recovery-tracker.brahua.com (la URL `recovery-tracker-brahua-lab.vercel.app` sigue funcionando). Tiene los datos reales. Para desarrollar y probar se usa Supabase local.

## 5. Cómo empezar a desarrollar

### Proceso para una nueva feature

1. Anotar la observación real: fecha, ruta, qué se hizo, qué se esperaba y el impacto.
2. Clasificarla como defecto, fricción, instrumentación o nueva necesidad.
3. Escribir o actualizar una spec en `docs/specs/` antes de programar.
4. Actualizar `tasks/plan.md` y `tasks/todo.md`.
5. Crear una rama corta `feat/...`, `fix/...`, `chore/...` o `docs/...` desde `main` y abrir un PR.
6. Escribir los tests primero y revisar la pantalla en un navegador real.
7. Pasar todos los checks, actualizar `CHANGELOG.md` y el handoff, y hacer commit. Merge solo con CI en verde: eso despliega a producción.

### Comandos

```bash
npm run supabase:start && npm run supabase:env:local   # Supabase local en .env.local
npm run dev
npm run lint && npm run typecheck && npm test && npm run build
npm run e2e:critical
npm run supabase:push:dry   # enlazado a producción: ver migraciones pendientes (no aplica nada)
```

### CI/CD (`.github/workflows/ci-cd.yml`)

- En cada PR corren los checks de calidad y los E2E, con Supabase local en Docker. Si llega un commit nuevo, el run anterior se cancela.
- En cada push a `main` corren los mismos checks y, **solo si todos pasan**, el job `deploy` hace `supabase db push` a producción y después `vercel deploy --prod`. Los runs de `main` nunca se cancelan y los deploys van de uno en uno.
- El auto-deploy de Vercel está apagado en `vercel.json` (`git.deploymentEnabled: false`), así que GitHub Actions es el único que despliega.
- Detalle completo: `docs/deployment.md`.

### Cuidados importantes

- Las env vars en Vercel deben ser de tipo **config** (antes "encrypted"), no *sensitive*. Con *sensitive* las variables `NEXT_PUBLIC_*` no están disponibles en el build y la app da un error 500.
- Para usar `gh`, cambiar a la cuenta **Brahua**: `gh auth switch --user Brahua`.
- **Nunca** correr E2E contra producción; solo contra Supabase local. Producción tiene un usuario real con datos que hay que conservar.
- Las migraciones son aditivas; algo destructivo necesita el OK del owner y un backup.
- El servidor en el puerto 3000 puede estar en uso por el desarrollador; no detenerlo sin preguntar.

### Pendientes detectados

- `.env.example` tenía un token real en `SUPABASE_ACCESS_TOKEN` (nunca se commiteó). Ya se reemplazó por un valor vacío, pero conviene revocarlo en Supabase → Account → Access Tokens.
- Pasos manuales del paso a producción (DNS, URLs de Auth, login anónimo): ver `docs/deployment.md`.

### Archivos para leer al empezar cada sesión

1. `AGENTS.md`
2. `RECAP.md` (este archivo)
3. `docs/deployment.md` y el último handoff en `docs/specs/`
4. `tasks/plan.md` y `tasks/todo.md`
5. `CHANGELOG.md`
6. La spec relacionada con la feature elegida

## 6. Skills y MCPs disponibles (Claude Code)

### Skills instaladas en el proyecto

Están en `.agents/skills/` (repo addyosmani/agent-skills; ver `skills-lock.json`).

| Para… | Skill |
|---|---|
| Decidir qué construir | `idea-refine`, `interview-me`, `spec-driven-development`, `planning-and-task-breakdown` |
| Implementar | `incremental-implementation`, `test-driven-development`, `source-driven-development`, `frontend-ui-engineering`, `api-and-interface-design` |
| Calidad | `code-review-and-quality`, `code-simplification`, `security-and-hardening`, `doubt-driven-development`, `debugging-and-error-recovery` |
| Navegador y rendimiento | `browser-testing-with-devtools` (usa el MCP `chrome-devtools`), `performance-optimization` |
| Entrega | `git-workflow-and-versioning`, `ci-cd-and-automation`, `shipping-and-launch`, `documentation-and-adrs`, `changelog-automation` |
| Otras | `context-engineering`, `observability-and-instrumentation`, `deprecation-and-migration`, `using-agent-skills` |

### Plugin de Vercel (skills con prefijo `vercel:`)

- **Next.js:** `nextjs`, `next-cache-components`, `turbopack`, `react-best-practices`, `shadcn`.
- **Operación:** `deploy`, `env`, `env-vars`, `status`, `deployments-cicd`, `vercel-cli`.
- **Otras:** `auth`, `vercel-storage`, `flags-sdk`, `ai-sdk`, `verification`.
- **Agentes especializados:** `vercel:deployment-expert` y `vercel:performance-optimizer`.

### Skills integradas de Claude Code

- `/code-review` y `/security-review`: revisar código antes de un merge.
- `/simplify`: limpiar código sin cambiar lo que hace.
- `/run`: levantar la app y verla funcionando.
- `/qa-deploy`: subir una rama a QA.
- `/design`: bocetos de pantallas (el proyecto usa referencias de Claude Design).
- `web-design-reviewer` y `web-design-guidelines`: revisar la interfaz.
- `/loop` y `/schedule`: tareas repetidas o programadas.

### MCPs

| MCP | Dónde se configura | Uso en este proyecto |
|---|---|---|
| `chrome-devtools` | `.mcp.json` (proyecto) | Revisar la app en Chrome: DOM, consola, red, rendimiento, Lighthouse |
| `supabase` | `.mcp.json` (proyecto), **solo lectura**, fijado a producción (`pevrupenrzueyzidfeah`) | Consultar esquema, tablas, logs y advisors de producción sin riesgo de modificar datos |
| `claude_design` | Configuración local del proyecto | Leer o crear diseños (ver `docs/design/claude-design-reference.md`) |
| `claude-in-chrome` | Extensión de Chrome | Automatizar el navegador sobre localhost o producción |
| Vercel | Plugin de Vercel | Deployments, logs y proyecto (requiere autenticación) |
| Claude Docs / Google Drive | Cuenta de claude.ai | Documentos vivos / archivos de Drive |

**Notas sobre los MCPs del proyecto:**

- La primera vez que se abre `claude` en el repo hay que **aprobar** los servidores de `.mcp.json`.
- `supabase` usa OAuth: al primer uso, ejecutar `/mcp` → `supabase` → autenticar con la cuenta de Supabase.
- Para permitir escrituras (por ejemplo, aplicar migraciones desde Claude), quitar `&read_only=true` de la URL. No se recomienda: el proyecto es producción y tiene datos reales. Las migraciones deben seguir pasando por `supabase/migrations/` y el CI.
