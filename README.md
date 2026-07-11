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

## Supabase Setup

Recommended workflow: use two hosted Supabase projects.

- `recovery-tracker-staging`
- `recovery-tracker-prod`

Use `staging` for local app development and validation. Promote the same migrations to `prod` only after verification.

Quick start:

1. Create both hosted projects in Supabase Cloud.
2. Point `.env.local` to `staging`.
3. Run `npm run supabase:login`.
4. Link the repo to `staging` with `npm run supabase:link`.
5. Apply migrations with `npm run supabase:push:linked`.
6. Configure Google OAuth in `staging`.
7. Verify login and data writes against `staging`.
8. Repeat the link/push flow for `prod`.

Detailed guide: `docs/setup/supabase-cloud-step-by-step.md`

Current working setup for this repo:

- Development is currently pointed at a hosted `staging` Supabase project.
- `prod` is intentionally deferred until the MVP is more stable.
- Google OAuth is configured in `staging`.
- Anonymous sign-in is enabled in non-production to support Playwright E2E without automating Google login.

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

## Optional Local Supabase CLI

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:env:local
npm run supabase:reset
npm run supabase:types
npm run supabase:stop
```

Notes:

- Cloud-first is the intended workflow for this repo.
- `supabase/config.toml` is already initialized for this repo.
- `supabase/seed.sql` is intentionally empty so resets work now and can be expanded later.
- For local Google OAuth, also fill `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`.
- Keep `.env.local` pointed at `staging` during day-to-day development.
- Detailed setup notes: `docs/setup/supabase-setup.md`

## Project Docs

- Product direction: `docs/ideas/recovery-ritual.md`
- Deferred ideas and design backlog: `docs/ideas/recovery-ritual-backlog.md`
- MVP spec: `docs/specs/recovery-ritual-mvp-spec.md`
- Implementation plan: `tasks/plan.md`
- Task list: `tasks/todo.md`

## Architecture Decisions

- `docs/decisions/ADR-001-use-supabase-direct-for-mvp-persistence.md`
- `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`

## Current Status

The project now has:

- Next.js foundation with App Router and `src/` structure
- Domain types, exercise constants, and Zod validation
- Supabase SSR clients, `proxy.ts`, Google OAuth callback handling, and a server-side recovery repository
- Initial SQL schema with RLS for rehab sessions, session exercises, and nightly closeouts
- Spanish post-therapy check-in flow with real persistence and recent-session history
- Spanish nightly closeout flow with real persistence and recent-closeout history
- Home / Today screen that prioritizes the next useful action, shows recent status, and rewards logging consistency
- Pure recovery calculations for pain trend, weekly load, rebound, sleep vs pain, and weekly story text
- Dashboard UI with mobile-first trend cards, lightweight charts, empty states, and observational weekly summary
- Medical report UI with 7- and 30-day windows, observational summaries, and conservative appointment prompts
- Visual system pass with atmospheric backgrounds, richer surfaces, subtle motion, and reduced-motion-safe completion feedback
- Focused regression coverage for calculations, report summaries, validation edges, and reusable test scripts
- Playwright E2E coverage for auth bootstrap, post-therapy save flow, and nightly closeout save flow
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

## Current Milestone

Tasks `1-12` in the MVP checklist are complete. The next decision is whether to move into production-readiness work, backlog prioritization, or a final spec/launch pass.

## Documentation Practice

Project docs should be updated whenever:

- a task is completed
- acceptance or verification status changes
- setup or workflow changes
- a new testing path becomes part of the normal flow
