# Todo: Recovery Ritual UX Redesign

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
