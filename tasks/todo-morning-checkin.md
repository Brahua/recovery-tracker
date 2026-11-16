# Todo: registro de la mañana y meta de sesiones

Spec: `docs/specs/morning-checkin-and-daily-goal-spec.md`
Plan: `tasks/plan-morning-checkin.md`

Regla: en la PC solo `npm run format`, `npm run lint`, `npm run design:check`, `npm run typecheck` y `npm test`. La migración y los e2e se validan en CI, en un PR a `main`.

## Fase 1: meta de sesiones

- [x] **G1: Preferencia `sessionGoal`** (S)
  - Acceptance:
    - `parseSessionGoal(metadata)` devuelve `{ perDay: 1–5, daysPerWeek: 1–7 }`; ausente o inválido → `{ 1, 7 }`
    - `formatSessionGoal` → "2 sesiones al día, 5 días a la semana" / "1 sesión, todos los días"
    - Ajustes → Mi recuperación y la configuración rápida del onboarding la editan; guardar no pisa `theme`, `accent` ni otras preferencias
  - Verify: unitarios del parser y del formato; typecheck; e2e de Ajustes en G3.
  - Files: `src/lib/session-goal.ts` (+ test), `src/lib/validation/session-goal.ts`, `src/features/settings/actions.ts`, `src/features/settings/session-goal-fields.tsx`, `src/features/onboarding/onboarding.tsx`
  - Deps: ninguna

- [x] **G2: Cálculo de progreso** (S)
  - Acceptance:
    - `getDayProgress(sessions, date, goal)` → `{ count, perDay, met }`
    - `getWeekProgress(sessions, now, goal)` → días `full | partial | empty`, `metDays`, `daysPerWeek`, `weekMet`
    - semana lunes–domingo en Lima; sesiones de otra semana no cuentan
  - Verify: unitarios con meta 1×7, 2×5, inválida, cambio de mes, domingo/lunes.
  - Files: `src/lib/session-goal-progress.ts` (+ test)
  - Deps: G1

- [x] **G3: Hoy y Registrar usan la meta** (M)
  - Acceptance:
    - tarjeta de Hoy según la tabla de la spec (0 / k de N / día completo / semana cumplida con descanso)
    - puntos de la semana lleno / medio / vacío y línea "k de D días esta semana" o "Semana cumplida"
    - el cierre nocturno ya no es necesario para "día completo" (sigue disponible como acción secundaria hasta la fase 2)
    - mensajes de éxito de sesión y cierre en `registrar-flow` según la meta
    - racha sin cambios (cualquier registro)
  - Verify: unitarios de `today-view-model` y `registrar-flow`; e2e: meta 1 → una sesión completa el día; cambio de meta en Ajustes.
  - Files: `src/lib/today-view-model.ts` (+ test), `src/lib/registrar-flow.ts` (+ test), `src/features/today/overview.tsx`, `src/lib/recovery-page-data.ts`, `tests/e2e/settings.spec.ts`
  - Deps: G2

- [ ] **G4: Recordatorio de sesión según la meta** (M)
  - Acceptance:
    - se envía solo si las sesiones de hoy < `perDay` y la semana no está cumplida
    - el dispatcher lee las sesiones de la semana y la meta de cada usuario con recordatorio pendiente
  - Verify: unitarios de `due-reminders` y `dispatch` (meta cumplida hoy, semana cumplida, sin meta).
  - Files: `src/lib/reminders/due-reminders.ts` (+ test), `src/lib/reminders/dispatch.ts` (+ test), `src/data/reminders-dispatch-store.ts`
  - Deps: G2

- [ ] **G5: Adherencia en el Reporte** (S)
  - Acceptance: línea "Meta: … · cumplida X de Y semanas" con semanas completas del periodo; sin semanas completas, no aparece.
  - Verify: unitarios de `report-view-model`.
  - Files: `src/lib/report-view-model.ts` (+ test), `src/features/reports/medical-report.tsx`
  - Deps: G2

### Checkpoint A
- [ ] format, lint, design:check, typecheck y unitarios en verde en la PC
- [ ] PRs 1 y 2 con CI en verde y desplegados
- [ ] El owner prueba en producción: meta 1×7 y 2×5

## Fase 2: registro de la mañana

- [ ] **M1: Tabla, tipos y repositorio** (M)
  - Acceptance:
    - migración aditiva `morning_checkins` (columnas de la spec, `unique (user_id, date)`, RLS de 4 políticas, trigger `updated_at`, grants como las demás tablas)
    - tipo `MorningCheckin`, esquema Zod (horas 0–24 de 0,5 en 0,5; calidad 1–5; dolor 0–10; rigidez; rebote opcional; notas)
    - repositorio: listar por rango, obtener, crear, actualizar, eliminar; duplicado de fecha → error legible
  - Verify: unitarios de validación y mappers; CI aplica la migración.
  - Files: `supabase/migrations/2026111…_morning_checkins.sql`, `src/types/recovery.ts`, `src/lib/validation/recovery.ts` (+ test), `src/data/recovery-log-repository.ts`, `src/data/recovery-log-mappers.ts` (+ test)
  - Deps: Checkpoint A

- [ ] **M2: Formulario "¿Cómo amaneciste?"** (M)
  - Acceptance:
    - `/registrar?mode=morning` reemplaza la pestaña "Cierre"; edición en `/registrar/manana/[id]`
    - fecha por defecto hoy, pasadas permitidas, futuras no; una por día
    - la pregunta de rebote aparece solo si el día anterior a la fecha elegida tiene sesiones
    - mensaje al guardar según la spec
    - `/registrar/cierre/[id]` sigue funcionando para editar cierres viejos
  - Verify: unitarios del estado del formulario; typecheck; e2e en M8.
  - Files: `src/features/check-in/morning-checkin/{form.tsx,actions.ts}`, `src/lib/morning-checkin-form-state.ts` (+ test), `src/app/(app)/registrar/page.tsx`, `src/app/(app)/registrar/manana/[id]/page.tsx`, `src/design-system/styles/surfaces/closeout.css`
  - Deps: M1

- [ ] **M3: Hoy con el registro de la mañana** (S)
  - Acceptance:
    - tarjeta secundaria "¿Cómo amaneciste? · 1 min" todo el día mientras no exista el de hoy
    - Hoy ya no ofrece el cierre nocturno
    - la racha cuenta sesiones, registros de la mañana y cierres viejos
  - Verify: unitarios de `today-view-model`.
  - Files: `src/lib/today-view-model.ts` (+ test), `src/features/today/overview.tsx`, `src/lib/recovery-page-data.ts`
  - Deps: M1

### Checkpoint B1
- [ ] PR 3 con CI en verde: el registro de la mañana se guarda y Hoy lo muestra

- [ ] **M4: Historial** (S)
  - Acceptance: registros de la mañana como "Cómo amaneciste" en su día, con editar y eliminar; cierres viejos sin cambios.
  - Verify: unitarios de `history-view-model`; e2e en M8.
  - Files: `src/lib/history-view-model.ts` (+ test), `src/features/history/history-morning-card.tsx`, `src/features/history/history-list.tsx`, `src/design-system/styles/surfaces/history.css`
  - Deps: M1

- [ ] **M5: Insights, dashboard y Reporte con ambas fuentes** (L → dividir si pasa de 5 archivos de lógica)
  - Acceptance:
    - `toDailySignals(closeouts, checkins)` alinea rebote (D-1), sueño (D-1→D), dolor y rigidez según la tabla de la spec
    - Insights, gráfico sueño vs. dolor y Reporte consumen `DailySignal`; textos "al despertar" / "al final del día" según el origen
    - energía solo de cierres viejos; sin datos, la línea no aparece
  - Verify: unitarios de `daily-signals`, `recovery-insights`, `recovery-calculations`, `insights-view-model`, `report-view-model`.
  - Files: `src/lib/daily-signals.ts` (+ test), `src/lib/recovery-insights.ts`, `src/lib/recovery-calculations.ts`, `src/lib/insights-view-model.ts`, `src/lib/report-view-model.ts`, `src/features/dashboard/overview.tsx` (+ tests)
  - Deps: M1

- [ ] **M6: Recordatorio de la mañana** (S)
  - Acceptance:
    - texto "¿Cómo amaneciste?"; se envía si hoy no hay registro de la mañana
    - hora guardada > 12:00 se interpreta como 08:00 en la app y en el dispatcher; Ajustes muestra la hora efectiva
  - Verify: unitarios de `settings`, `due-reminders`, `messages`.
  - Files: `src/lib/reminders/{settings,due-reminders,messages}.ts` (+ tests), `src/data/reminders-dispatch-store.ts`, `src/features/reminders/reminders-settings.tsx`
  - Deps: M1, G4

- [ ] **M7: Textos, onboarding y demo** (S)
  - Acceptance:
    - onboarding, tour, landing y manifest explican el registro de la mañana y la meta; no se habla de "cerrar el día"
    - `seed-data.mjs` genera registros de la mañana y metas 1×7, 2×5 y 1×3
  - Verify: `node --test scripts/demo/seed-data.test.mjs`; typecheck. `npm run demo:reset` solo con OK del owner tras el deploy.
  - Files: `src/features/onboarding/{onboarding.tsx,tour-steps.ts}`, `src/components/signed-out-landing.tsx`, `src/app/manifest.ts`, `scripts/demo/seed-data.mjs` (+ test)
  - Deps: M2

- [ ] **M8: E2E** (M)
  - Acceptance:
    - `morning-checkin.spec.ts`: guardar, rebote condicional, duplicado de fecha, editar
    - `nightly-closeout.spec.ts` pasa a cubrir solo ver y editar un cierre viejo
    - accesibilidad y layout móvil incluyen el formulario nuevo
  - Verify: CI.
  - Files: `tests/e2e/morning-checkin.spec.ts`, `tests/e2e/nightly-closeout.spec.ts`, `tests/e2e/edit-records.spec.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/mobile-layout.spec.ts`
  - Deps: M2–M6

### Checkpoint B
- [ ] PRs 3–5 con CI en verde y desplegados
- [ ] El owner prueba en producción: registro de la mañana, Historial con cierres viejos, Insights y Reporte

## Fase 3: documentación

- [ ] **D1: Docs** (S)
  - Acceptance: spec marcada como entregada; `docs/HANDOFF.md`, `RECAP.md`, `CHANGELOG.md` y `README.md` actualizados.
  - Files: esos cuatro + la spec
  - Deps: Checkpoint B
