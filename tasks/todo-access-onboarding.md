# Todo: acceso por invitación, onboarding y apariencia

Spec: `docs/specs/access-onboarding-personalization-spec.md` · Plan: `tasks/plan-access-onboarding.md`

Verificación en la PC: `npm run format && npm run lint && npm run design:check && npm run typecheck && npm test`. Build, E2E y Supabase local en CI.

## PR 1: acceso por invitación (base)

- [x] A1. Migración de acceso
  - Acceptance: `app_access_settings` (una fila, `invite_only`), `access_allowlist` (`email text` PK en minúsculas, `note`, `created_at`), RLS sin políticas de usuario; `before_user_created_hook` (permite anónimos y modo `open`; en `invite_only` exige email en la lista, sin distinguir mayúsculas; si no, error `not_invited`); permisos solo para `supabase_auth_admin`; hook activado en `supabase/config.toml`. Aditiva.
  - Verify: CI aplica la migración; `npm run supabase:push:dry` lista solo esta migración.
  - Files: `supabase/migrations/20261004000000_access_control.sql`, `supabase/config.toml`

- [x] A2. Pruebas SQL del hook (OK del owner el 2026-10-01; verdes en CI, 10 casos)
  - Acceptance: pgTAP cubre permitir/rechazar por modo y lista, mayúsculas, anónimos, y que `authenticated` no lee las tablas; paso `npx supabase test db` en CI.
  - Verify: CI verde.
  - Files: `supabase/tests/access_control.test.sql`, `.github/workflows/ci-cd.yml`

- [x] A3. Pantalla "no invitado"
  - Acceptance: el callback mapea el error del hook a `reason=not_invited`; `/auth/auth-code-error` muestra el mensaje de invitación y "Intentar con otra cuenta" (vuelve a la landing).
  - Verify: tests unitarios de `auth-callback-error`; E2E de la página con `?reason=not_invited` (axe).
  - Files: `src/lib/auth-callback-error.ts` (+ test), `src/app/auth/callback/route.ts`, `src/app/auth/auth-code-error/page.tsx`

- [x] A4. ADR-005 y documentación
  - Acceptance: ADR de acceso por invitación (hook en la base, modo `open`, admin en `app_metadata`); `docs/deployment.md` con cómo activar/apagar el hook y cómo hacer "Ban user"; `CHANGELOG`, `HANDOFF`.
  - Files: `docs/decisions/ADR-005-invite-only-access.md`, `docs/deployment.md`, `CHANGELOG.md`, `docs/HANDOFF.md`

- [x] A5. Producción (tras el deploy)
  - Acceptance: función presente en producción; hook activado por Management API; `app_metadata.role = "admin"` en la cuenta del owner.
  - Verify: un correo no invitado ve el mensaje y no aparece en `auth.users`; el owner entra.

## PR 2: acceso en Ajustes (admin)

- [x] B1. Funciones de admin
  - Acceptance: `admin_list_access`, `admin_invite_email`, `admin_remove_email`, `admin_set_access_mode`, cada una verifica el rol admin del JWT; `grant execute` a `authenticated`. Aditiva.
  - Verify: pgTAP (admin sí, no admin error); CI.
  - Files: `supabase/migrations/20261005000000_access_admin.sql`, `supabase/tests/access_admin.test.sql`, `src/types/database.generated.ts`

- [x] B2. Validación y Server Actions
  - Acceptance: zod para email (recorta, minúsculas, formato) y modo; actions que devuelven `{ ok, error? }`, mensajes en español, `revalidatePath("/ajustes")`.
  - Verify: tests de validación.
  - Files: `src/lib/validation/access.ts` (+ test), `src/features/access/actions.ts`

- [x] B3. Sección "Acceso" en Ajustes
  - Acceptance: visible solo con `app_metadata.role === "admin"`; invitar + compartir (Web Share / copiar); lista con "Pendiente"/"Ya entró" y "Quitar" con confirmación en la app; interruptor de modo con confirmación; estilos con tokens.
  - Verify: `design:check`; E2E en B4.
  - Files: `src/features/access/access-settings.tsx`, `src/app/(app)/ajustes/page.tsx`, `src/design-system/styles/surfaces/settings.css`

- [x] B4. E2E y docs
  - Acceptance: E2E (usuario anónimo promovido a admin solo en local): invitar, ver "Pendiente", quitar; sin rol no ve la sección; axe; en `e2e:critical`; `CHANGELOG`, `HANDOFF`.
  - Files: `tests/e2e/access.spec.ts`, `package.json`, docs

## PR 3: apariencia en tema oscuro (espera los 3 colores)

- [ ] C1. Tokens de acento derivados de `--rr-accent-rgb`
  - Acceptance: `--rr-accent-tint`, `-border`, `-card`, `--rr-selection` y similares usan `rgb(var(--rr-accent-rgb) / …)`.
  - Verify: `npm run -s css:compare -- compare <baseline> --resolve` sin cambios.
  - Files: `src/design-system/styles/tokens/colors.css`

- [ ] C2. Lógica de apariencia
  - Acceptance: tipos, defaults, validación zod, parseo de cookie y de `user_metadata.preferences`; `saveAppearanceAction` (updateUser + cookie); el callback de login reescribe la cookie.
  - Verify: tests unitarios.
  - Files: `src/lib/appearance.ts` (+ test), `src/lib/validation/appearance.ts` (+ test), `src/features/settings/actions.ts`, `src/app/auth/callback/route.ts`

- [ ] C3. Atributos en `<html>` y los 3 acentos
  - Acceptance: el servidor pinta `data-theme`/`data-accent`; bloques `[data-accent="…"]` con la familia completa de tokens de cada color; contraste AA verificado.
  - Verify: typecheck; chequeo de contraste; revisión visual con `npm run dev` si el owner lo pide.
  - Files: `src/app/layout.tsx` o `src/app/(app)/layout.tsx`, `src/design-system/styles/tokens/colors.css`

- [ ] C4. Sección "Apariencia"
  - Acceptance: tema (solo Oscuro habilitado hasta el PR 4) y 3 muestras de color; vista previa al instante y guardado con toast.
  - Files: `src/features/settings/appearance-settings.tsx`, `src/app/(app)/ajustes/page.tsx`, `src/design-system/styles/surfaces/settings.css`

- [ ] C5. E2E y docs
  - Acceptance: cambiar color persiste tras recargar; axe con cada color; docs.
  - Files: `tests/e2e/appearance.spec.ts`, docs

## PR 4: tema claro

- [ ] D1. Propuesta de paleta clara + chequeo de contraste (el owner la aprueba antes de seguir)
  - Files: `scripts/design-system/check-contrast.mjs` (o test), vista previa para el owner
- [ ] D2. Tokens claros y "Sistema" (`[data-theme="light"]` y `prefers-color-scheme` para `system`)
  - Files: `src/design-system/styles/tokens/colors.css`
- [ ] D3. Revisión de superficies con fondos fijos (noche, éxito, insights, reporte)
  - Files: `src/design-system/styles/surfaces/*.css`, tokens
- [ ] D4. `themeColor` por tema y barra de estado
  - Files: `src/app/layout.tsx`, `src/lib/appearance.ts`
- [ ] D5. Axe en los dos temas, habilitar Claro/Sistema en Ajustes, docs
  - Files: `tests/e2e/accessibility.spec.ts`, `tests/e2e/appearance.spec.ts`, docs

## PR 5: onboarding

- [ ] E1. Decisión de redirigir a `/bienvenida` (función pura + layout)
  - Files: `src/lib/onboarding.ts` (+ test), `src/app/(app)/layout.tsx`
- [ ] E2. Recorrido (tarjetas con scroll-snap, Siguiente/Atrás/Saltar, accesible, reduce movimiento)
  - Files: `src/features/onboarding/tour.tsx`, `tour-steps.ts`, `src/design-system/styles/surfaces/onboarding.css`
- [ ] E3. Configuración rápida + `completeOnboardingAction`
  - Files: `src/features/onboarding/setup-form.tsx`, `actions.ts`, ruta `/bienvenida`
- [ ] E4. "Ver el recorrido otra vez" en Ajustes
  - Files: `src/app/(app)/ajustes/page.tsx`
- [ ] E5. E2E (completo, saltar, repetir; axe) y docs
  - Files: `tests/e2e/onboarding.spec.ts`, docs
