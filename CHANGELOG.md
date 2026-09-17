# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project currently follows Semantic Versioning for tagged releases.

## [Unreleased]

### Added
- Global loading feedback: a top progress bar fed by every server round-trip (links, programmatic navigation, form submissions and server actions) plus a route skeleton, and floating toasts confirming every write (session, closeout, exercise save/archive/reactivate/merge, routine save/delete, session→routine).
- Fallback error screen for failures no form handled, keeping the shell and offering a retry.
- Per-user exercise catalog (`/ejercicios`) with defaults, "isometric by default", archive/reactivate and merge; each user starts with 10 exercises.
- Compact session logging: one summary row per exercise, detail in a native dialog sheet, accent-insensitive name autocomplete, most-used quick picks, and create/reactivate from typed names.
- Isometric logging with hold seconds per set, shown in history.
- Routines: templates of catalog exercises with their plan, managed under `Ejercicios → Rutinas`, applied from Registrar ("Usar rutina", skipping exercises already logged) and created from a saved session ("Guardar como rutina").
- Atomic `create_rehab_session`, `save_routine` and `create_routine_from_session` RPCs sharing `resolve_exercise_for_user`.
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
- Greeting and sidebar show the name saved on the account (`user_metadata.full_name`), falling back to the email local part.
- Signed-in routes live in an `(app)` route group whose layout renders the shell once, so navigation swaps only the content; this supersedes the earlier removal of the Historial loading boundary, which had no shell.
- Replaced the TKE and Estiramientos suaves shortcuts with Wall sit and Puente de gluteos, then replaced fixed shortcuts with the catalog and dropped `session_exercises.shortcut_id`.
- Insights counts catalog exercises once per session, even after renames or merges.
- Split the former `Carga y cierre` concept into `Esfuerzo de la sesión`, `Estado al terminar`, and the separate `Cierre del día` ritual.
- Bound save confirmations to the exact newly-created session so concurrent tabs cannot show another recent session.
- Moved session and nightly closeout forms out of the former one-page home into a focused registration flow.
- Reworked auth callback errors and safe redirect URL handling.
- Expanded responsive, accessibility, contrast, focus, empty-state, and reduced-motion behavior across the redesigned product.
- Updated the current-week strip to display Monday through Sunday and mark `Hoy` on its calendar weekday.
- Aligned the responsive Historial with its mobile and desktop Claude Design references, including the date rail, single-open session accordion, two-column exercise details, separate closeout cards, and viewport-specific navigation.

### Fixed
- Kept the session, closeout and report action bars above the mobile tab bar and reserved its height at the end of each screen.
- Showed the full catalog on a new user's first Registrar visit (a repeated GET in the same server render returned a memoized empty list).
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
