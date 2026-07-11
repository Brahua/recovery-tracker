# Implementation Plan: Recovery Ritual MVP

## Overview

Build a Spanish, mobile-first Recovery Ritual MVP with real persistence from the start. The app should let the user log post-therapy sessions, complete a nightly closeout, view meaningful recovery trends, and prepare a concise medical report. The first implementation should avoid diagnostic language and keep the daily ritual short.

## Architecture Decisions

- **Responsive web first, PWA later:** validates core product and UI before adding installation/offline behavior.
- **Spanish-first UI:** all user-facing labels, empty states, and insights should be written in Spanish.
- **Real persistence from the start:** the recovery log should use a real database-backed data layer before it is considered usable.
- **Supabase direct for MVP persistence:** use Supabase/PostgreSQL directly behind a repository/data-access layer. See `docs/decisions/ADR-001-use-supabase-direct-for-mvp-persistence.md`.
- **Google login from MVP:** use Supabase Auth with Google as the primary login method. See `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`.
- **Domain contracts before UI:** define recovery session, nightly closeout, exercise shortcuts, and summary calculations before wiring screens.
- **Rule-based insights only:** no AI in MVP; summaries should be deterministic observations.
- **Motivation through consistency:** achievements and progress states should reward logging and reflection, not higher load or pain tolerance.
- **Design iteration with Google Stitch:** use Google Stitch to explore key screen designs, then implement the chosen direction in code with project components and accessibility checks.

## Dependency Graph

```text
Project scaffold
  -> Supabase Auth with Google
    -> Domain types and validation schemas
      -> Persistence schema, RLS, and data access
        -> Post-therapy check-in flow
        -> Nightly closeout flow
          -> Dashboard calculations
            -> Dashboard UI
            -> Medical report UI
              -> Google Stitch-informed visual polish and browser review
```

## Phase 1: Foundation

- [x] Task 1: Scaffold the app and baseline tooling.
- [x] Task 2: Define domain types, constants, and validation schemas.
- [x] Task 3: Add real persistence foundation and data access layer.

### Checkpoint: Foundation

- [x] App runs locally.
- [x] Build and lint commands exist.
- [x] Database-backed create/list path is available for at least one recovery record type.
- [x] Domain validation tests pass.

## Phase 2: Core Rituals

- [x] Task 4: Build the post-therapy check-in vertical slice.
- [x] Task 5: Build the nightly closeout vertical slice.
- [x] Task 6: Build the Home / Today screen.

### Checkpoint: Core Rituals

- [x] A therapy session can be created from the UI and persists.
- [x] A nightly closeout can be created from the UI and persists.
- [x] Home screen shows the next useful action and recent status.
- [x] Mobile layout is usable at narrow widths.

## Phase 3: Understanding Progress

- [x] Task 7: Implement recovery calculations and rule-based insights.
- [x] Task 8: Build dashboard trend cards and charts.
- [x] Task 9: Build the medical report screen.

### Checkpoint: Progress and Reports

- [x] Dashboard answers trend, rebound, load, and sleep questions.
- [x] Medical report summarizes 7- and 30-day windows.
- [x] Insights are phrased as observations, not advice.

## Phase 4: Motivation, Polish, and Verification

- [x] Task 10: Add visual system, motion, and completion feedback.
- [x] Task 11: Add focused tests for calculations and core flows.
- [x] Task 12: Run browser review and fix responsive/accessibility issues.

### Checkpoint: MVP Review

- [x] Build succeeds.
- [x] Tests pass.
- [x] No console errors in core flows inspected so far.
- [x] Mobile and desktop layouts are visually reviewed for the current Home / Today, Dashboard, and Medical Report flow.
- [x] MVP satisfies the spec in `docs/specs/recovery-ritual-mvp-spec.md`.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Google OAuth/Supabase auth setup slows down the MVP | Medium | Keep auth to Google login only and avoid email/password flows. |
| Forms become too long | High | Keep required fields minimal and use progressive disclosure for exercise details. |
| Charts look impressive but do not answer real questions | Medium | Build calculations around the four dashboard questions in the spec. |
| Gamification rewards unsafe behavior | High | Reward consistency, completion, and reflection only. |
| Medical wording crosses into advice | High | Use observation language and keep recommendation generation out of MVP. |
| Visual polish delays usable data capture | Medium | Land functional vertical slices first, then add motion and polish. |

## Open Questions

- What does the doctor/fisio usually ask that the app should prepare?
- What Google Stitch outputs should be treated as implementation input: screenshots, exported code, or only visual direction?
