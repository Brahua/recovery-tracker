# Todo: Recovery Ritual MVP

## Task 1: Scaffold the app and baseline tooling

**Description:** Create the Next.js/React/TypeScript app foundation with styling, linting, and baseline project structure.

**Acceptance criteria:**
- [x] App runs with `npm run dev`.
- [x] `npm run build` and `npm run lint` are available.
- [x] Base directories exist for features, components, domain types, data, and docs.

**Verification:**
- [x] Run `npm run dev`.
- [x] Run `npm run build`.
- [x] Run `npm run lint`.

**Dependencies:** None.

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `src/app/`
- `src/`

**Estimated scope:** Medium.

## Task 2: Define domain types, constants, and validation schemas

**Description:** Create the TypeScript domain model for sessions, nightly closeouts, exercise shortcuts, ratings, and validation.

**Acceptance criteria:**
- [x] Pain scores, rating scales, session types, final state, rebound pain level, and exercise shortcuts are typed.
- [x] Zod schemas validate post-therapy and nightly closeout inputs.
- [x] User-facing exercise labels are Spanish-first.

**Verification:**
- [x] Run typecheck/build.
- [x] Add and run unit tests for valid/invalid schema examples if test tooling exists.

**Dependencies:** Task 1.

**Files likely touched:**
- `src/types/recovery.ts`
- `src/lib/validation/recovery.ts`
- `src/lib/constants/exercises.ts`
- test files

**Estimated scope:** Small.

## Task 3: Add real persistence foundation and data access layer

**Description:** Set up Supabase Auth with Google login, database-backed persistence, RLS, and a repository interface for recovery sessions and nightly closeouts.

**Acceptance criteria:**
- [x] Supabase direct persistence follows ADR-001.
- [x] Google login with Supabase Auth follows ADR-002.
- [x] Database schema supports rehab sessions, session exercises, and nightly closeouts.
- [x] Tables include `user_id` ownership and RLS policies.
- [x] Data access functions can create and list both record types.
- [x] Required environment variables are documented without committing secrets.

**Verification:**
- [x] Run migration or schema setup command.
- [x] Run a create/list smoke test or integration test.
- [x] Run `npm run build`.

**Dependencies:** Tasks 1-2.

**Files likely touched:**
- database/schema or migration files
- auth callback route/files
- `src/data/recovery-log-repository.ts`
- `.env.example`
- `docs/specs/recovery-ritual-mvp-spec.md` if persistence decision changes

**Estimated scope:** Medium.

## Task 4: Build the post-therapy check-in vertical slice

**Description:** Implement the Spanish post-therapy check-in UI and wire it to persistence.

**Acceptance criteria:**
- [x] User can create a therapy session with required fields.
- [x] Exercise shortcuts include the 10 provided exercises.
- [x] Completion feedback confirms save and shows a non-medical micro-summary.

**Verification:**
- [x] Manual check on mobile width.
- [x] Record appears after save and persists after reload.
- [x] Run `npm run build`.

**Dependencies:** Tasks 1-3.

**Files likely touched:**
- `src/features/check-in/`
- `src/components/`
- `src/data/`
- route/page files

**Estimated scope:** Medium.

## Task 5: Build the nightly closeout vertical slice

**Description:** Implement the Spanish nightly closeout UI and wire it to persistence.

**Acceptance criteria:**
- [x] User can log end-of-day pain, energy, sleep, sleep quality, rebound pain, and optional note.
- [x] Rebound is tracked as delayed pain only.
- [x] Completion feedback updates the user without giving medical advice.

**Verification:**
- [x] Manual check on mobile width.
- [x] Record appears after save and persists after reload.
- [x] Run `npm run build`.

**Dependencies:** Tasks 1-3.

**Files likely touched:**
- `src/features/check-in/`
- `src/components/`
- `src/data/`
- route/page files

**Estimated scope:** Medium.

## Task 6: Build the Home / Today screen

**Description:** Create the main screen that shows recovery status, next useful action, and compact recent trends.

**Acceptance criteria:**
- [x] Home screen prioritizes logging a therapy session or nightly closeout.
- [x] Recent session/closeout status is visible.
- [x] Consistency/streak indicator rewards logging, not performance.

**Verification:**
- [x] Manual check with no data, partial data, and recent data.
- [x] Run `npm run build`.

**Dependencies:** Tasks 4-5.

**Files likely touched:**
- `src/features/today/`
- `src/features/dashboard/`
- route/page files
- `src/data/`

**Estimated scope:** Medium.

## Task 7: Implement recovery calculations and rule-based insights

**Description:** Add pure functions for date ranges, pain trends, weekly load, rebound counts, sleep/pain comparisons, and weekly story text.

**Acceptance criteria:**
- [x] Calculations work for empty, partial, and normal data.
- [x] Insight text is observational and Spanish-first.
- [x] No medical recommendations are produced.

**Verification:**
- [x] Unit tests cover core calculations and edge cases.
- [x] Run `npm test`.
- [x] Run `npm run build`.

**Dependencies:** Tasks 2, 4, 5.

**Files likely touched:**
- `src/lib/recovery-calculations.ts`
- `src/lib/recovery-insights.ts`
- test files

**Estimated scope:** Medium.

## Task 8: Build dashboard trend cards and charts

**Description:** Create the dashboard UI for pain trends, weekly load, sleep vs pain, rebound, and recent exercises.

**Acceptance criteria:**
- [x] Dashboard displays meaningful empty states.
- [x] Charts/cards answer the spec's core questions.
- [x] Mobile and desktop layouts are readable.

**Verification:**
- [x] Manual check with seeded or real data.
- [x] Run `npm run build`.

**Dependencies:** Task 7.

**Files likely touched:**
- `src/features/dashboard/`
- `src/components/charts/`
- route/page files

**Estimated scope:** Medium.

## Task 9: Build the medical report screen

**Description:** Create an on-screen 7/30-day report for doctor/fisio appointments.

**Acceptance criteria:**
- [x] Report includes date range, pain trend, high-pain days, session response, rebound associations, sleep/energy summary, and questions.
- [x] Report avoids raw-data overload.
- [x] Copy is Spanish-first and medically conservative.

**Verification:**
- [x] Manual check with real or seeded data.
- [x] Run `npm run build`.

**Dependencies:** Task 7.

**Files likely touched:**
- `src/features/reports/`
- route/page files
- `src/lib/recovery-insights.ts`

**Estimated scope:** Medium.

## Task 10: Add visual system, motion, and completion feedback

**Description:** Apply the motivating visual direction: vital, tactile, animated, accessible, and informed by Google Stitch iterations where useful.

**Acceptance criteria:**
- [x] Key screen direction is iterated or validated with Google Stitch before final UI polish.
- [x] Completion states have subtle motion.
- [x] Visual design avoids generic AI-app purple-gradient styling.
- [x] Reduced-motion users are respected.
- [x] Color is not the only state indicator.

**Verification:**
- [x] Manual visual review on mobile and desktop.
- [x] Run `npm run build`.

**Dependencies:** Tasks 4-9.

**Files likely touched:**
- global styles
- `src/components/`
- feature UI files

**Estimated scope:** Medium.

## Task 11: Add focused tests for calculations and core flows

**Description:** Strengthen test coverage around the behavior most likely to regress.

**Acceptance criteria:**
- [x] Unit tests cover trend, rebound, weekly load, date range, and report summary logic.
- [x] Form validation tests cover invalid pain/rating/sleep values.
- [x] Tests are documented in package scripts.

**Verification:**
- [x] Run `npm test`.
- [x] Run `npm run build`.

**Dependencies:** Tasks 2, 7, 9.

**Files likely touched:**
- test files
- `package.json`
- calculation/validation files if testability improvements are needed

**Estimated scope:** Small to Medium.

## Task 12: Run browser review and fix responsive/accessibility issues

**Description:** Review the app in a real browser across mobile and desktop sizes, then fix layout, console, and accessibility issues.

**Acceptance criteria:**
- [x] Core flows have no console errors.
- [x] Layout works at mobile, tablet, desktop, and wide widths.
- [x] Interactive elements are keyboard accessible.
- [x] Main pages have meaningful empty states.

**Verification:**
- [x] Browser review screenshots or notes.
- [x] Run `npm run build`.
- [x] Run `npm run lint`.

**Dependencies:** Tasks 4-10.

**Files likely touched:**
- UI component files
- styles
- route/page files

**Estimated scope:** Medium.
