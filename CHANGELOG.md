# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project currently follows Semantic Versioning for tagged releases.

## [Unreleased]

### Added
- Weekly schema drift check (`.github/workflows/schema-drift.yml`, also runnable by hand): fails if the production `public` schema differs from `supabase/migrations/` (`supabase db diff --linked`, read-only). First run on 2026-10-01: no drift. The E2E suite also passed on the `ubuntu-26.04` runner image, ahead of the `ubuntu-latest` switch on 2026-10-19.
- Edit or delete past records: sessions (`/registrar/sesion/[id]`) and nightly closeouts (`/registrar/cierre/[id]`) open the Registrar forms with their saved values, from an "Editar" button in Historial or "Corregir" on the saved screens. Every field can change, dates included (no future dates, one closeout per day). Deleting asks for confirmation. New `update_rehab_session` replaces a session with its exercises, sets and treatments in one transaction; the child inserts are shared with `create_rehab_session` (`insert_rehab_session_children`). Old aggregated exercise rows become equal sets when edited. App-level not-found page.
- Physio treatments in Insights and Report: an Insights card compares, for each treatment with 3+ sessions, the average pain change and same-night rebound against physio sessions without it; the Report lists treatments applied with their zones, and its highlighted notes include the therapist's instructions.
- Physio treatments: a "Tratamientos del centro" card in Registrar for *Fisio guiada* sessions to log physical agents (tecar, shockwave, laser…), manual therapy, invasive techniques and taping, each with an optional zone and minutes, plus the therapist's instructions. A physio session can be saved with exercises or treatments. Shown in Historial; the latest physio instructions appear in Hoy until the next physio session. New table `session_treatments` and column `rehab_sessions.therapist_notes`; `create_rehab_session` saves both atomically.
- Scheduled reminders: Supabase `pg_cron` calls `POST /api/reminders/dispatch` every 5 minutes (Bearer secret from Vault); the endpoint sends the session and closeout reminders that are due, still pending and not sent today (window of two hours after the chosen time, Lima time), reserves each delivery before sending and removes subscriptions the browser dropped.
- Reminders setup in `/ajustes`: turn on notifications per device (push subscription stored with RLS), choose time and on/off for the session and closeout reminders (defaults: session off at 18:00, closeout on at 21:30), and send a test notification (`web-push` with VAPID keys). New tables `push_subscriptions`, `reminder_settings` and `reminder_deliveries`.
- Installable app (PWA): web manifest, app icon (gold progress ring) for the home screen, browser tab and iOS, dark status bar, and a service worker that shows a self-contained offline page when a navigation fails without network.
- `/ajustes`: choose the name the app greets you with (`user_metadata.display_name`, kept across Google sign-ins; empty falls back to the Google name) and a guide to install the app on the iPhone. Reached from the sidebar and from the avatar in Hoy on mobile.
- `npm run design:check` (in CI): fails when a stylesheet outside `src/design-system/styles/tokens/` uses a literal color, easing or font stack.
- Security headers on every route (`frame-ancestors 'none'`, `X-Frame-Options`, `Referrer-Policy`, `nosniff`, `Permissions-Policy`) and no `X-Powered-By`.
- Production database guard: `supabase:push` scripts refuse to write to a linked hosted project without `ALLOW_PROD_DB=1` (only CI sets it); Playwright refuses to run unless Supabase is local.
- Automated accessibility checks with axe (WCAG 2.1 A/AA) on every main screen, with seeded data, in `e2e:critical`.
- Single `docs/HANDOFF.md` as the session entry point; dated handoffs moved to `docs/archive/handoffs/`.
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
- Date pickers in Registrar (session) and the nightly closeout are a single large row: the row itself opens the phone's date picker, instead of a "cambiar" button that revealed a second, small field.
- Styles split from `src/app/globals.css` into `src/design-system/styles/` (tokens, base, components, one file per screen), imported in cascade order; compiled CSS unchanged (`npm run css:compare`).
- Design tokens split by kind (colors, typography, motion, shadows, radius, spacing); every literal color, easing and font stack outside `tokens/` now uses a token (`rgb(var(--rr-*-rgb) / alpha)` for transparency). Compiled values unchanged.
- The former staging Supabase project and Vercel app are now production, served at https://recovery-tracker.brahua.com (ADR-004).
- Trunk-based CI/CD like `brahua-os`: PRs run CI only; pushes to `main` never cancel, deploy one at a time, check the deploy secrets first, and migrate + deploy only when every check passes. CI runs on Node 24 (`.nvmrc`) with a pinned Vercel CLI and the same action versions as `brahua-os` (`checkout`, `setup-node`, `upload-artifact` @v7).
- Vercel Git deployments are fully disabled (no previews); GitHub Actions is the only deployer.
- Local development and E2E default to the local Supabase stack; tests never touch production.
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
- Session times are read as Lima time on the server: it runs in UTC and parsed the form's `datetime-local` value as UTC, five hours off. Future session dates are rejected.
- Toasts on iOS: the popover viewport could stretch over the whole screen, turning the toast into a full-height dark card that hid the page. Its position now uses longhands with a content height, toasts never stretch, and the viewport ignores taps.
- Remaining small text using `--rr-text-dim` (date in Hoy, streak card, progress ring label, pending ritual, history range, set actions, form hints) now uses `--rr-text-muted` to reach 4.5:1; decorative glyphs keep the dim color.
- Landing copy for the nightly closeout now matches what it records ("Dolor, energia y sueno antes de dormir."); it promised stiffness and mood, which the closeout does not capture.
- Color contrast below 4.5:1 on small text in Registrar, Ejercicios and Historial (new `--rr-accent-on-tint` for green text on tinted backgrounds).
- Kept the session, closeout and report action bars above the mobile tab bar and reserved its height at the end of each screen.
- Showed the full catalog on a new user's first Registrar visit (a repeated GET in the same server render returned a memoized empty list).
- Prevented incomplete selected exercises from enabling session saves, identified each unfinished exercise in the form, and preserved all entered values when server validation rejects a submission.
- Prevented the Historial route from replacing the current module with a shell-less loading screen during navigation.
- Kept evening sessions visible by querying calendar ranges with Lima-aware UTC boundaries.
- Increased inactive mobile-navigation contrast after a Lighthouse accessibility finding.
- Prevented open redirects and surfaced callback failures through a dedicated auth error state.
- Corrected the weekly strip, which previously rendered a rolling seven-day window ending on today.
- Unified recovery calendar dates in `America/Lima` so evening sessions and closeouts remain on the correct local day.

### Removed
- Unused design tokens: `--rr-bg-night`, `--rr-paper-ink`, `--rr-amber`, `--rr-page-padding`, `--rr-page-padding-mobile`, `--rr-card-padding` and the `ritual-*` colors of the Tailwind bridge (no class used them). The compiled stylesheet only loses those six declarations.
- Pre-redesign light theme: the unused `RitualSuccessState` component, the legacy stylesheet (classes without `rr-`, light `body` background, legacy keyframes and tokens) and three unused `rr-` classes. Text selection now uses the dark-theme `--rr-selection`.
- Tailwind no longer scans `docs/`, `tasks/` or `scripts/`, so class names mentioned in prose stop generating unused utilities.

## [0.1.0] - 2026-07-10
### Added
- Initial Recovery Ritual MVP built with Next.js, React, and Supabase.
- Post-therapy check-in, nightly closeout, dashboard, and medical report flows.
- Validation, recovery calculations, unit tests, and Playwright E2E coverage.
- Project documentation, setup guides, and architecture decision records.
