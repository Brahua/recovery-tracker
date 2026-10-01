# Recovery Ritual

Recovery Ritual is a Spanish, mobile-first recovery tracker for knee surgery rehab. The MVP focuses on fast post-therapy logging, nightly closeouts, useful recovery trends, and concise medical appointment reports.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run test:validation
npm run test:recovery
npm run e2e
```

## Environments

There is a single hosted environment: **production**.

- App: https://recovery-tracker.brahua.com (Vercel project `brahua-lab/recovery-tracker`)
- Supabase: `pevrupenrzueyzidfeah` (formerly `recovery-tracker-staging`; promoted to production on 2026-09-30, see `docs/decisions/ADR-004-promote-staging-to-production.md`)
- Google OAuth is configured in that project. Anonymous sign-in is off in production; it is only enabled in local Supabase for Playwright.

Trunk-based workflow: short branches and PRs against `main`; every push to `main` runs CI and, only if every check passes, migrates Supabase and deploys to production. Details: `docs/deployment.md`.

E2E always run against a throwaway local Supabase (in CI), never production. On the owner's PC Docker, `next build` and E2E are avoided (see `AGENTS.md`); visual checks use `npm run dev` against production only when asked, without creating test data.

Detailed guide: `docs/setup/supabase-cloud-step-by-step.md`

## Remote Supabase Commands

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:push:dry
npm run supabase:push:linked
```

## Playwright E2E

Run the current critical flow regression suite:

```bash
npm run e2e
```

Useful focused commands:

```bash
npm run e2e:auth
npm run e2e:critical
npm run test:validation
npm run test:recovery
```

In development, the Playwright setup authenticates through a Supabase anonymous user for testing. This keeps real Auth + RLS behavior while avoiding Google OAuth automation failures.

## Local Supabase CLI

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:env:local
npm run supabase:reset
npm run supabase:types
npm run supabase:stop
```

Notes:

- Local Supabase (Docker) is what CI uses for E2E. Locally it needs Docker, which is avoided on the owner's PC unless asked.
- `supabase/config.toml` is already initialized for this repo.
- `supabase/seed.sql` is intentionally empty so resets work now and can be expanded later.
- For local Google OAuth, also fill `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`.
- Pointing `.env.local` at the hosted project means writing real production data; do it only on purpose, and never run E2E that way.
- Detailed setup notes: `docs/setup/supabase-setup.md`

## Project Docs

- Quick project recap (start here): `RECAP.md`
- Product direction: `docs/ideas/recovery-ritual.md`
- Deferred ideas and design backlog: `docs/ideas/recovery-ritual-backlog.md`
- MVP spec: `docs/specs/recovery-ritual-mvp-spec.md`
- UX redesign spec and Claude Design prompt pack: `docs/specs/recovery-ritual-ux-redesign-spec.md`
- Implemented Claude Design inventory and recorded deviations: `docs/design/claude-design-reference.md`
- Current handoff (read first when resuming): `docs/HANDOFF.md`; older handoffs in `docs/archive/handoffs/`
- Exercise catalog spec: `docs/specs/exercise-catalog-spec.md`
- Routines spec: `docs/specs/routines-spec.md`
- Deployment and migration workflow: `docs/deployment.md`
- Implementation plan: `tasks/plan.md`
- Task list: `tasks/todo.md`

## Architecture Decisions

- `docs/decisions/ADR-001-use-supabase-direct-for-mvp-persistence.md`
- `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`
- `docs/decisions/ADR-003-store-individual-exercise-sets-additively.md`
- `docs/decisions/ADR-004-promote-staging-to-production.md`

## Current Status

The project now has:

- Next.js foundation with App Router and `src/` structure
- Domain types, exercise constants, and Zod validation
- Supabase SSR clients, `proxy.ts`, Google OAuth callback handling, and a server-side recovery repository
- SQL schema with RLS for rehab sessions, session exercises, individual exercise sets, and nightly closeouts
- Spanish post-therapy check-in flow with real persistence and recent-session history
- Backdated session registration with an editable occurrence date and time
- Spanish nightly closeout flow with backdated registration, selected-day session context, and duplicate/future-date protection
- Signed-out landing with stronger product framing and clearer auth entry
- Development-only anonymous test entry preserved in the signed-out flow for local auth-safe validation
- Authenticated app shell with mobile-first navigation for `Hoy`, `Registrar`, `Historial`, `Insights`, and `Reporte`
- Home / Today screen that prioritizes the next useful action, shows recent status, and keeps insights/report as secondary previews
- Current-week strip ordered Monday through Sunday with `Hoy` on the actual weekday
- Recovery calendar comparisons normalized to `America/Lima` while persisted timestamps remain in UTC
- Dedicated `Registrar` route with session and nightly closeout modes instead of embedding both forms in `/`
- Individual series per exercise with repetitions, kilograms, notes, duration, and distance
- Read-only `Historial` with 30-day windows, multiple sessions per day, closeout details, and backward-compatible legacy prescriptions
- Separate session effort, immediate knee state, and end-of-day closeout concepts
- Pure recovery calculations for pain trend, weekly load, rebound, sleep vs pain, and weekly story text
- Dedicated `Insights` route with mobile-first trend cards, lightweight charts, empty states, and observational weekly summary
- Dedicated `Reporte` route with 7- and 30-day windows, observational summaries, and conservative appointment prompts
- Route-local success states after saving session and nightly closeout, with next-step CTAs
- Visual system pass with atmospheric backgrounds, richer surfaces, subtle motion, and reduced-motion-safe completion feedback
- Browser-reviewed mobile layout pass for the new multi-route flow, including shell compaction and navigation-density cleanup
- Focused regression coverage for calculations, report summaries, validation edges, and reusable test scripts
- Playwright E2E coverage for auth bootstrap, post-therapy save validation, backdated nightly closeouts, duplicate/future-date protection, and read-only history
- Manual browser verification with Chrome DevTools MCP for signed-out, empty, partial, and complete Today states
- Manual browser verification with Chrome DevTools MCP for dashboard empty and populated states in mobile and desktop
- Manual browser verification with Chrome DevTools MCP for medical report empty and authenticated states
- Manual browser verification with Chrome DevTools MCP for the polished signed-out and authenticated UI in desktop and mobile emulation
- Browser review complete across mobile, tablet, desktop, and wide layouts, including the wide-screen overflow fix

## Verified State

Latest verified commands:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run test:validation`
- `npm run test:recovery`
- `npm run build`
- `npm run e2e:auth`
- `npm run e2e` (`9 passed` against an isolated anonymous staging context)
- `npm test` (`94 passed`)

Latest redesign verification also included:

- Playwright-driven mobile screenshots for landing, `Hoy`, `Registrar`, `Insights`, and `Reporte`
- Manual review of generated screenshots followed by mobile shell cleanup
- Desktop and mobile browser verification of the Monday-to-Sunday current-week strip

## Current Milestone

The MVP, UX redesign, individual-series capture, read-only history, robust session validation, and backdated closeouts are implemented and browser-reviewed. Since then the exercise catalog, routines and global loading/feedback have shipped. Regression coverage is green. The former staging project is now production at https://recovery-tracker.brahua.com and holds the single real user's data. The current milestone remains the real-use trial.

## Documentation Practice

Project docs should be updated whenever:

- a task is completed
- acceptance or verification status changes
- setup or workflow changes
- a new testing path becomes part of the normal flow
