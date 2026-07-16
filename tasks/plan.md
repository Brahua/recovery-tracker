# Implementation Plan: Recovery Ritual UX Redesign

## Overview

Restructure Recovery Ritual from a single long signed-in page into a mobile-first multi-screen product that preserves the current MVP behavior while improving clarity, motivation, and perceived quality.

The redesign should separate the product into clear modes:

- signed-out landing
- `Hoy`
- `Registrar`
- `Insights`
- `Reporte`
- success/completion states

Claude Design will be used to generate near-implementation layout explorations, but final UI decisions must be filtered through the existing product behavior, route constraints, and accessibility needs.

## Architecture Decisions

- **Behavior first, architecture second, polish third:** keep current session/closeout/dashboard/report functionality intact while reorganizing routes and screen responsibilities.
- **One screen, one job:** every authenticated route should have one primary product purpose.
- **`Hoy` as the default cockpit:** the main signed-in landing route should prioritize the next useful action and current momentum.
- **Dedicated logging surface:** post-therapy and nightly closeout forms move into a shared `Registrar` route with an explicit mode switch.
- **Insights and report remain separate tabs:** analytics and appointment-prep stay distinct to reduce cognitive mixing.
- **Navigation follows the selected references:** desktop uses a persistent sidebar; mobile keeps each screen focused and exposes route transitions through contextual actions rather than adding navigation absent from the approved compositions.
- **Claude Design as guided exploration, not authority:** prompts should yield strong mobile layouts, but implementation should stay grounded in the repo's functional constraints and copy tone.
- **Visual direction combines recovery calm with comeback energy:** premium, motivating, tactile, and serious.

## Dependency Graph

```text
Redesign spec approval
  -> Route and navigation architecture
    -> Signed-out landing redesign
    -> Hoy route refactor
    -> Registrar route and ritual split
      -> Success/completion states
    -> Insights route extraction
    -> Reporte route extraction
      -> Shared layout shell and navigation polish
        -> Claude Design-informed visual refinement
          -> Browser verification and regression pass
```

## Phase 1: UX Architecture and Design Inputs

- [x] Task 1: Convert the redesign spec into an implementation-ready route map and UI shell plan.
- [x] Task 2: Catalog the selected Claude Design outputs for all key screens.

### Checkpoint: UX Direction Locked

- [x] The route model for `Hoy`, `Registrar`, `Insights`, and `Reporte` is explicit.
- [x] Mobile and desktop Claude Design references are selected and cataloged for all key screens.
- [x] Mobile navigation behavior is defined before route code changes begin.

## Phase 2: Screen Separation

- [x] Task 3: Build the shared authenticated app shell with mobile-first navigation.
- [x] Task 4: Refactor `/` into a focused `Hoy` screen with only secondary previews for insights/report.
- [x] Task 5: Create the `Registrar` route with dedicated session and closeout subviews.
- [x] Task 6: Move dashboard content into `Insights`.
- [x] Task 7: Move medical report content into `Reporte`.

### Checkpoint: Product Modes Separated

- [x] The signed-in app no longer presents all product modes in one vertical page.
- [x] Logging flows are accessible from a dedicated route and preserve existing save behavior.
- [x] Insights and report are reachable from primary navigation and render independently.

## Phase 3: Motivation and Completion

- [x] Task 8: Add completion-state UX for session and nightly closeout saves.
- [x] Task 9: Redesign the signed-out landing and auth entry experience.
- [x] Task 10: Apply the selected Claude Design system and screens one increment at a time.

### Checkpoint: Emotional Product Quality

- [x] `Hoy` matches the selected mobile and desktop direction while remaining action-first.
- [x] Completion moments match their selected references without childish gamification.
- [x] The signed-out state matches its selected mobile and desktop direction.

## Phase 4: Verification and Hardening

- [x] Task 11: Add route-level and state-selection test coverage for the redesigned flow.
- [x] Task 12: Run browser review across mobile and desktop and fix layout/accessibility regressions.

### Checkpoint: Redesign Review

- [x] Build succeeds.
- [x] Existing validation/calculation coverage remains green.
- [x] Core signed-in flows work across route boundaries.
- [x] Mobile navigation, primary CTA behavior, and responsive shells are manually verified.

## Phase 5: One-Week Field Validation

- [ ] Use the staging application daily from 2026-07-16 through 2026-07-23.
- [ ] Record friction, incorrect assumptions, confusing copy, missing history, and data-quality issues as they occur.
- [ ] Prioritize fixes and additions from observed use after the trial instead of expanding the product spec during the observation window.

### Checkpoint: Field Evidence Collected

- [ ] The session and nightly closeout rituals have been exercised under normal daily use.
- [ ] Week boundaries, multiple same-day sessions, timestamps, insights, and reports have been observed with real data.
- [ ] Findings are classified as defects, usability improvements, or new product requirements.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Route separation breaks current save/redirect behavior | High | Move screens incrementally and verify each flow after extraction. |
| Bottom nav increases UI chrome and reduces focus | Medium | Keep nav compact, persistent, and subordinate to screen content. |
| Claude Design outputs drift into visually attractive but impractical layouts | Medium | Treat prompts as exploration input and filter against real component/data needs. |
| `Hoy` becomes another dashboard in disguise | High | Limit `Hoy` to action-first status, compact summaries, and previews only. |
| Reworked forms feel slower than the current MVP | High | Preserve current field model and optimize grouping, defaults, and CTA placement. |
| Visual redesign harms trust by over-indexing on hype | Medium | Balance athletic energy with calm recovery cues and medically conservative copy. |

## Parallelization Notes

Can be done in parallel:

- Claude Design prompt iteration and route-map planning
- landing redesign and authenticated shell exploration
- insights/report route extraction after shell decisions stabilize

Must stay mostly sequential:

- navigation shell before final route extraction
- `Hoy` refactor before final CTA deep-link rules
- success-state UX after `Registrar` flow shape is stable

## Verification Strategy

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- targeted Playwright checks for route flow and mobile nav
- manual browser review for visual quality, scanability, and responsive behavior

## Open Questions

- Whether the signed-out landing should remain tightly personal or lightly future-facing for a broader audience.
- Whether detailed day-by-day history is necessary after observing the current recent-summary, Insights, and Reporte surfaces for one week.

## Progress Notes

- The redesign spec and Claude Design prompt pack are captured in `docs/specs/recovery-ritual-ux-redesign-spec.md`.
- The authenticated app now uses distinct routes for `Hoy`, `Registrar`, `Insights`, and `Reporte`.
- Save flows now redirect back into `Registrar` with route-local success/error states instead of returning to the old one-page home.
- Mobile browser review was run against landing, `Hoy`, `Registrar`, `Insights`, and `Reporte`, followed by a shell-density cleanup and naming consistency fixes.
- The 17 selected Claude Design artifacts are cataloged in `docs/design/claude-design-reference.md`.
- The shared Design System and both Hoy compositions are implemented, browser-compared, and covered by deterministic state-selection tests.
- Registrar: Sesion now matches its mobile/desktop compositions while preserving all persisted session types, exercise shortcuts, the 1-5 load scale, and the existing server action.
- Sesion Guardada is now an immersive, data-driven completion screen with real session metrics, day progress, streak, and reference-aligned onward navigation.
- Registrar: Cierre now uses the approved night composition, full persisted domain scales, four-step progress, and the existing closeout server action.
- Dia Cerrado is now an immersive, data-driven completion screen with the animated ritual ring, actual session/closeout details, calculated streak, and reference-aligned navigation.
- Insights now matches the approved dark analytical composition with functional range selection, real pain/load/rebound/sleep/exercise charts, and truthful sparse-data states.
- Reporte now matches the approved responsive composition with real range controls, six data-driven sections, selectable appointment questions, native PDF printing, and share fallback.
- Landing now matches the approved photo-led mobile and split desktop compositions, preserves Google OAuth, and keeps anonymous demo access development-only.
- All 17 selected Claude Design artifacts are now implemented across the shared system and eight responsive product surfaces.
