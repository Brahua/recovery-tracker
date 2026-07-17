# Todo: Historial de recuperación y series individuales

Spec: `docs/specs/recovery-history-and-exercise-sets-spec.md`

Plan: `tasks/plan.md`

## Fase 1: Contrato y persistencia

- [ ] Task 1: Definir y validar el contrato de series individuales.
  - Acceptance: `ExerciseSet` admite repeticiones, peso y nota opcionales; `SessionExercise` admite series ordenadas, duración, distancia y una representación separada para datos agregados anteriores; un ejercicio es válido con al menos una serie válida o duración/distancia.
  - Verify: Escribir primero pruebas fallidas y ejecutar `npm run test:validation` hasta que pasen.
  - Dependencies: Ninguna.
  - Files: `src/types/recovery.ts`, `src/lib/validation/recovery.ts`, `src/lib/validation/recovery.test.ts`
  - Scope: M.

- [ ] Task 2: Añadir la migración aditiva para series y métricas generales.
  - Acceptance: Existe `session_exercise_sets` con restricciones, índices, FK compuesta y RLS por propietario; `session_exercises` incorpora duración y distancia sin eliminar columnas antiguas.
  - Verify: Revisar SQL, ejecutar `npm run supabase:push:dry`, aplicar en staging y comparar conteos antes/después.
  - Dependencies: Task 1.
  - Files: `supabase/migrations/20260716000000_exercise_sets_and_history.sql`
  - Scope: S.

- [ ] Task 3: Persistir y recuperar series mediante el repositorio.
  - Acceptance: Las escrituras nuevas insertan ejercicios y series ordenadas; las lecturas cargan series por lotes; un fallo anidado elimina la sesión parcial; los campos antiguos siguen siendo legibles.
  - Verify: Ejecutar pruebas focalizadas del mapeo/repositorio, `npm run typecheck` y `npm test`.
  - Dependencies: Tasks 1 y 2.
  - Files: `src/data/recovery-log-repository.ts`, `src/data/recovery-log-mappers.ts`, `src/data/recovery-log-mappers.test.ts`, `src/types/recovery.ts`
  - Scope: M.

### Checkpoint: Persistencia preparada

- [ ] Migración aplicada en staging sin pérdida de registros.
- [ ] Contrato, validación y lectura dual pasan pruebas.
- [ ] La aplicación sigue compilando antes de cambiar el formulario.

## Fase 2: Registro de series

- [ ] Task 4: Crear el modelo de estado del editor de ejercicios.
  - Acceptance: Funciones puras agregan, duplican, actualizan y eliminan series sin mutar el estado; mantienen identificadores locales y orden estable.
  - Verify: Seguir RED-GREEN-REFACTOR con `npm test -- src/lib/exercise-entry-state.test.ts`.
  - Dependencies: Task 1.
  - Files: `src/lib/exercise-entry-state.ts`, `src/lib/exercise-entry-state.test.ts`
  - Scope: S.

- [ ] Task 5: Construir el editor accesible de detalle por ejercicio.
  - Acceptance: Ejercicios predefinidos y personalizados permiten series individuales, duplicado, eliminación, duración y distancia; todos los controles tienen etiquetas y funcionan a 320 px.
  - Verify: Ejecutar prueba del estado, typecheck y revisión manual de teclado/móvil.
  - Dependencies: Task 4.
  - Files: `src/components/exercise-entry-editor.tsx`, `src/features/check-in/post-therapy/form.tsx`, `src/app/globals.css`
  - Scope: M.

- [ ] Task 6: Integrar el payload anidado y separar los tres momentos de respuesta.
  - Acceptance: La Server Action trata el payload como no confiable, lo valida y persiste; la sesión muestra `Esfuerzo de la sesión` y `Estado al terminar`; el ritual nocturno usa `Cierre del día`.
  - Verify: Añadir pruebas de parsing, ejecutar `npm test`, `npm run typecheck` y el E2E focalizado de registro.
  - Dependencies: Tasks 3 y 5.
  - Files: `src/features/check-in/post-therapy/actions.ts`, `src/features/check-in/post-therapy/actions.test.ts`, `src/features/check-in/post-therapy/form.tsx`, `src/features/check-in/nightly-closeout/form.tsx`
  - Scope: M.

### Checkpoint: Registro completo

- [ ] Varias series diferentes sobreviven una recarga.
- [ ] Duración/distancia se guardan sin series.
- [ ] No se crean sesiones parciales y los tres conceptos están separados.

## Fase 3: Historial

- [ ] Task 7: Crear el view model del historial.
  - Acceptance: Agrupa por día de Lima, ordena fechas y sesiones de forma determinista, conserva múltiples sesiones y asocia el único cierre del día.
  - Verify: Seguir RED-GREEN-REFACTOR con `npm test -- src/lib/history-view-model.test.ts`.
  - Dependencies: Task 3.
  - Files: `src/lib/history-view-model.ts`, `src/lib/history-view-model.test.ts`
  - Scope: S.

- [ ] Task 8: Añadir la lectura paginada de historial al límite de datos.
  - Acceptance: Una ventana de 30 días carga sesiones, ejercicios, series y cierres por lotes; el límite anterior se valida y no permite acceder a datos de otro usuario.
  - Verify: Ejecutar pruebas de fechas/view model, `npm run typecheck` y revisar las consultas/RLS.
  - Dependencies: Tasks 3 y 7.
  - Files: `src/data/recovery-log-repository.ts`, `src/lib/recovery-page-data.ts`, `src/lib/history-view-model.ts`
  - Scope: M.

- [ ] Task 9: Implementar `/historial` como experiencia de solo lectura.
  - Acceptance: La ruta autenticada muestra resumen y detalle por día, estados vacío/error/carga anterior y ninguna acción de edición o eliminación.
  - Verify: Ejecutar build y revisión de DOM/teclado en móvil y escritorio.
  - Dependencies: Task 8.
  - Files: `src/app/historial/page.tsx`, `src/app/historial/loading.tsx`, `src/features/history/history-list.tsx`, `src/app/globals.css`
  - Scope: M.

- [ ] Task 10: Integrar Historial en la navegación principal.
  - Acceptance: El shell ofrece cinco destinos con estado activo correcto y sin desbordamiento a 320, 768, 1024 y 1440 px.
  - Verify: Ejecutar typecheck y revisar navegación real por teclado en los cuatro anchos.
  - Dependencies: Task 9.
  - Files: `src/components/app-shell.tsx`, `src/app/globals.css`
  - Scope: S.

### Checkpoint: Historial completo

- [ ] Los últimos 30 días aparecen en orden y permiten cargar una ventana anterior.
- [ ] Varias sesiones y el cierre de una fecha aparecen juntos.
- [ ] Datos antiguos y nuevos son legibles sin controles de modificación.

## Fase 4: Verificación y entrega

- [ ] Task 11: Completar regresión, seguridad, runtime y documentación.
  - Acceptance: E2E cubre series e historial; no hay regresiones en Insights/Reporte; RLS y validación se auditan; README, changelog, handoff, spec, plan y tareas reflejan el resultado real.
  - Verify: Ejecutar `npm test`, `npm run e2e`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm audit --audit-level=high`, `git diff --check` y revisión real de consola/red/responsive.
  - Dependencies: Tasks 1-10.
  - Files: `tests/e2e/post-therapy-check-in.spec.ts`, `tests/e2e/history.spec.ts`, `README.md`, `CHANGELOG.md`, `docs/specs/recovery-history-and-exercise-sets-spec.md`
  - Scope: M.

---

# Todo archivado: Recovery Ritual UX Redesign

- [x] Task: Define the final route map and screen responsibilities for the redesign.
  - Acceptance: `Hoy`, `Registrar`, `Insights`, `Reporte`, signed-out landing, and success states each have a single clear product job and route ownership.
  - Verify: Review against [recovery-ritual-ux-redesign-spec.md](/Users/brahua/dev/recovery-tracker/docs/specs/recovery-ritual-ux-redesign-spec.md).
  - Files: `docs/specs/recovery-ritual-ux-redesign-spec.md`, `tasks/plan.md`, `tasks/todo.md`

- [x] Task: Catalog the selected Claude Design references for every key screen.
  - Acceptance: The design system plus mobile and desktop references for landing, `Hoy`, both `Registrar` modes, `Insights`, `Reporte`, and both success states are recorded in one canonical inventory.
  - Verify: Review all 17 artifacts in `docs/design/claude-design-reference.md`.
  - Files: `docs/design/claude-design-reference.md`, `docs/specs/recovery-ritual-ux-redesign-spec.md`

- [x] Task: Build an authenticated app shell with mobile-first primary navigation.
  - Acceptance: Signed-in users can navigate between `Hoy`, `Registrar`, `Insights`, and `Reporte` through a persistent mobile-first nav; desktop adapts the same information architecture.
  - Verify: Run `npm run build` and manually verify authenticated navigation at mobile and desktop widths.
  - Files: `src/app/layout.tsx`, `src/components/`, `src/app/`, `src/app/globals.css`

- [x] Task: Refactor the home route into a focused `Hoy` screen.
  - Acceptance: `/` shows today's status, dominant CTA, secondary CTA, ritual progress, streak/consistency, recent state summary, and only compact previews for insights/report.
  - Verify: Manual review with no data, partial data, and complete-day data; run `npm run build`.
  - Files: `src/app/page.tsx`, `src/features/today/`, `src/components/`

- [x] Task: Create the `Registrar` route with separate session and closeout views.
  - Acceptance: Logging is moved off the home screen; session and closeout forms remain functionally intact and are switched through an explicit mode control.
  - Verify: Save a session and a closeout from the new route; run `npm run build`.
  - Files: `src/app/`, `src/features/check-in/`, `src/components/`

- [x] Task: Extract dashboard content into the `Insights` route.
  - Acceptance: Dashboard cards and charts render as a dedicated screen and are no longer fully embedded in `/`.
  - Verify: Manual review with empty and populated data; run `npm run build`.
  - Files: `src/app/`, `src/features/dashboard/`, `src/components/`

- [x] Task: Extract medical report content into the `Reporte` route.
  - Acceptance: Medical summary content renders as a dedicated screen and is reachable from primary navigation.
  - Verify: Manual review with empty and populated data; run `npm run build`.
  - Files: `src/app/`, `src/features/reports/`, `src/components/`

- [x] Task: Add completion-state UX after session and nightly closeout saves.
  - Acceptance: Each ritual produces a clear reward moment, observational micro-summary, and next-step CTA without using childish gamification.
  - Verify: Manually complete both rituals and confirm the resulting states; run `npm run build`.
  - Files: `src/features/check-in/`, `src/features/today/`, `src/components/`, `src/app/`

- [x] Task: Redesign the signed-out landing experience.
  - Acceptance: The unauthenticated route becomes a deliberate landing/auth screen with stronger hierarchy, clearer benefits, and a more compelling sign-in CTA.
  - Verify: Manual review signed out at mobile and desktop widths; run `npm run build`.
  - Files: `src/app/page.tsx`, `src/components/`, `src/app/globals.css`

- [x] Task: Apply the selected Claude Design references one screen at a time.
  - Acceptance: The design system and all eight surfaces match their selected mobile and desktop references without changing existing functional behavior.
  - Verify: Complete the ordered checklist in `docs/design/claude-design-reference.md`, including browser comparison and reduced-motion checks; run `npm run build`.
  - Files: `src/app/globals.css`, `src/components/`, `src/features/`

- [x] Task: Add regression coverage for the redesigned navigation and state logic.
  - Acceptance: Route-level behavior and `Hoy` CTA selection logic are covered without regressing existing test coverage for calculations and validation.
  - Verify: Run `npm test` and any targeted E2E commands added for the redesign.
  - Files: `tests/`, `src/lib/`, `src/features/`, `package.json`

- [x] Task: Run final browser review and fix responsive/accessibility issues.
  - Acceptance: Mobile-first navigation, route transitions, focus states, and narrow-width layouts are verified and adjusted where needed.
  - Verify: Run manual browser review plus `npm run build`, `npm run lint`, `npm run typecheck`, and `npm test`.
  - Files: `src/app/`, `src/components/`, `src/features/`, `src/app/globals.css`

- [ ] Task: Complete the one-week field validation window.
  - Acceptance: Daily-use observations from 2026-07-16 through 2026-07-23 are captured with enough context to distinguish defects, friction, and new requirements.
  - Verify: Review the field questions and observation format in `docs/specs/session-handoff-2026-07-16.md`, then prioritize the next iteration from evidence.
  - Files: `docs/specs/session-handoff-2026-07-16.md`, `tasks/plan.md`, `tasks/todo.md`
