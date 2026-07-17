# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project currently follows Semantic Versioning for tagged releases.

## [Unreleased]

### Added
- Backdated nightly closeouts from the UI, with session context for the selected day and safeguards against future or duplicate dates.
- Read-only `Historial` route with 30-day windows, Lima-day grouping, multiple same-day sessions, nightly closeouts, loading/error/empty states, and responsive navigation.
- Individual exercise sets with repetitions, kilograms, optional set notes, total duration, and total distance.
- Additive `session_exercise_sets` persistence with RLS, composite ownership constraints, compatible legacy reads, and browser regression coverage.
- Multi-screen authenticated product structure with dedicated `Hoy`, `Registrar`, `Insights`, and `Reporte` routes.
- Responsive Claude Design implementation for the shared system, landing, ritual forms, completion states, insights, and medical report.
- Data-driven success states, report range controls, selectable appointment questions, native PDF printing, and share fallback.
- Deterministic view models and regression tests for auth callback errors, registrar state, form progress, Today state, insights, and reports.
- Project-owned rehabilitation hero image and a canonical inventory of the 19 implemented design references.

### Changed
- Split the former `Carga y cierre` concept into `Esfuerzo de la sesión`, `Estado al terminar`, and the separate `Cierre del día` ritual.
- Bound save confirmations to the exact newly-created session so concurrent tabs cannot show another recent session.
- Moved session and nightly closeout forms out of the former one-page home into a focused registration flow.
- Reworked auth callback errors and safe redirect URL handling.
- Expanded responsive, accessibility, contrast, focus, empty-state, and reduced-motion behavior across the redesigned product.
- Updated the current-week strip to display Monday through Sunday and mark `Hoy` on its calendar weekday.
- Aligned the responsive Historial with its mobile and desktop Claude Design references, including the date rail, single-open session accordion, two-column exercise details, separate closeout cards, and viewport-specific navigation.

### Fixed
- Prevented incomplete selected exercises from enabling session saves, identified each unfinished exercise in the form, and preserved all entered values when server validation rejects a submission.
- Prevented the Historial route from replacing the current module with a shell-less loading screen during navigation.
- Kept evening sessions visible by querying calendar ranges with Lima-aware UTC boundaries.
- Increased inactive mobile-navigation contrast after a Lighthouse accessibility finding.
- Prevented open redirects and surfaced callback failures through a dedicated auth error state.
- Corrected the weekly strip, which previously rendered a rolling seven-day window ending on today.
- Unified recovery calendar dates in `America/Lima` so evening sessions and closeouts remain on the correct local day.

## [0.1.0] - 2026-07-10
### Added
- Initial Recovery Ritual MVP built with Next.js, React, and Supabase.
- Post-therapy check-in, nightly closeout, dashboard, and medical report flows.
- Validation, recovery calculations, unit tests, and Playwright E2E coverage.
- Project documentation, setup guides, and architecture decision records.
